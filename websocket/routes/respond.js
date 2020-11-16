const { AES } = require("../util/cryptojs/cryptojs");
const { typeCheck } = require("../util");
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
  { connectionId, ...socket }
) => {
  const answer = JSON.parse(
    AES.decrypt(answerCrypt, process.env.CRYPTO_SECRET)
  );
  let isCorrect;
  if (typeCheck("String", answer))
    isCorrect = answer.trim().toLowerCase() === response.trim().toLowerCase();
  else if (typeCheck("Number", answer))
    isCorrect = answer === Number.parseFloat(response);
  else if (typeCheck("[String]", answer)) isCorrect = answer.includes(response);
  else if (typeCheck("[Number]", answer))
    isCorrect = answer.includes(Number.parseFloat(response));
  else if (typeCheck(null, answer)) isCorrect = null;

  const coinsEarned = !!isCorrect; // Simplified binary points system, make complex later

  const pk = `MEETING#${meetingId}`;
  const PutParams = (sk) => ({
    Put: {
      TableName: process.env.db,
      ExpressionAtrributeNames: {
        "#sk": sk,
      },
      ConditionExpression: "attribute_not_exists(#sk)",
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

  const transactPromise = docClient
    .transactWrite({
      TransactItems: [
        PutParams(`RES#${id}#${askTimestamp}#${questionId}`),
        PutParams(`RES#${askTimestamp}#${questionId}#${id}`),
        PutParams(`RES#${questionId}#${askTimestamp}#${id}`),
        {
          Update: {
            TableName: process.env.db,
            Key: { pk, sk: `USER#STUDENT#${id}` },
            ExpressionAttributeNames: { "#sk": `USER#STUDENT#${id}` },
            ExpressionAttributeValues: {
              ":coin": coinsEarned,
              ":streak": isCorrect,
            },
            // If isCorrect is null then is ungraded, should not reset streak
            UpdateExpression: "ADD coinTotal :coin".concat(
              isCorrect === false
                ? " SET gamification.currentStreak 0"
                : ", gamification.currentStreak :streak"
            ),
            ConditionExpression: "attribute_exists(#sk)",
          },
        },
      ],
    })
    .promise();

  const connections = (
    await Promise.all([queryUsers(null, meetingId), transactPromise])
  )[0];

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
    .filter((el) => el !== `CONN#STUDENT#${connectionId}`)
    .map((el) =>
      (async (role, userId) => {
        try {
          await socket.send(
            role === "TEACHER" ? teacherPayload : studentPayload,
            userId
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log("Message could not be sent - CLIENT DISCONNECTED");
        }
      })(el.split("#")[1], el.split("#")[2])
    );

  await Promise.all(emitPromises);

  return {
    statusCode: 200,
  };
};

module.exports = respond;
