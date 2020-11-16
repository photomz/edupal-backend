const {
  Crypto: { AES },
} = require("../util/cryptojs/cryptojs");
const { typeCheck } = require("../util/type-check/lib");
const { docClient, queryUsers } = require("../util");

/**
 * Student action of responding to question posed by teacher
 * Emits response to all teachers and notifies all students
 * Updates coinTotal and gamification streaks
 * @param {*} data
 * @param {*} socket
 */
const respond = async (
  {
    meetingId,
    askTimestamp,
    answerCrypt,
    classId,
    response,
    student: { name, id },
    questionId,
    respondTimestamp,
    avatar,
  },
  socket
) => {
  let answer;
  try {
    answer = AES.decrypt(answerCrypt, process.env.CRYPTO_SECRET);
  } catch (error) {
    return {
      statusCode: 404,
      reason: "DecryptionError",
      error,
    };
  }
  let isCorrect;
  if (typeCheck("String", answer))
    isCorrect = answer.trim().toLowerCase() === response.trim().toLowerCase();
  else if (typeCheck("Number", answer))
    isCorrect = answer === Number.parseFloat(response);
  else if (typeCheck("[String]", answer)) isCorrect = answer.includes(response);
  else if (typeCheck("[Number]", answer))
    isCorrect = answer.includes(Number.parseFloat(response));
  else if (typeCheck(null, answer)) isCorrect = null;

  const coinsEarned = Number(isCorrect); // Simplified binary points system, make complex later

  const pk = `MEETING#${meetingId}`;
  const PutParams = (sk) => ({
    Put: {
      TableName: process.env.db,
      ConditionExpression: "attribute_not_exists(sk)",
      Item: {
        pk,
        sk,
        classId,
        response: {
          name,
          response,
          isCorrect,
          coinsEarned,
          respondTimestamp,
        },
      },
    },
  });

  // If isCorrect is null then is ungraded, should not reset streak
  const switcher = isCorrect === false;
  const transactPromise = docClient
    .transactWrite({
      TransactItems: [
        PutParams(`RES#${id}#${askTimestamp}#${questionId}`),
        PutParams(`RES#${askTimestamp}#${questionId}#${id}`),
        PutParams(`RES#${questionId}#${askTimestamp}#${id}`),
        {
          Update: {
            TableName: process.env.db,
            Key: { pk, sk: `USER#STUDENT#${meetingId}#${id}` },
            ExpressionAttributeValues: {
              ":coin": coinsEarned,
              [switcher ? ":z" : ":inc"]: switcher ? 0 : Number(isCorrect),
            },
            UpdateExpression: "ADD coinTotal :coin".concat(
              switcher
                ? "  SET gamification.currentStreak :z"
                : ", gamification.currentStreak :inc"
            ),
            ConditionExpression: "attribute_exists(sk)",
          },
        },
      ],
    })
    .promise();

  let connections;
  try {
    [connections] = await Promise.all([
      queryUsers(null, meetingId),
      transactPromise,
    ]);
  } catch (error) {
    return {
      statusCode: 404,
      reason:
        "Error in DynamoDb for put response, update meeting user, and query all connected users",
      error,
    };
  }

  const teacherPayload = {
    action: "recieveResponse",
    data: {
      questionId,
      response,
      respondTimestamp,
      isCorrect,
      coinsEarned,
      student: {
        name,
        id,
        avatar,
      },
    },
  };

  const studentPayload = {
    action: "streamResponse",
    data: {
      questionId,
      student: { name, id, avatar },
    },
  };

  const emitPromises = connections
    .filter((el) => el !== `CONN#STUDENT#${id}`)
    .map(({ sk: el }) =>
      (async (role, userId) => {
        try {
          await socket.send(
            JSON.stringify(
              role === "TEACHER" ? teacherPayload : studentPayload
            ),
            userId
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`socket.send failed because id ${userId} disconnected`);
        }
      })(el.split("#")[1], el.split("#")[2])
    );

  await Promise.all(emitPromises);

  return {
    statusCode: 200,
  };
};

module.exports = respond;
