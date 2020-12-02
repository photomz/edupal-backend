const {
  Crypto: { AES },
} = require("../util/cryptojs/cryptojs");
const { docClient, queryUsers } = require("../util");

/**
 * Teacher action of asking a question to students, emits message to each student
 * Answer in student emit is encrypted
 * @param {*} data
 * @param {*} socket
 */
const ask = async (
  {
    meetingId,
    avatar,
    askTimestamp,
    questionId,
    teacher,
    classId,
    question,
    answer,
    meta,
  },
  socket
) => {
  let answerCrypt;
  try {
    answerCrypt = AES.encrypt(
      JSON.stringify(answer),
      process.env.CRYPTO_SECRET
    );
  } catch (error) {
    return {
      statusCode: 404,
      reason: "EncryptionError",
      error,
    };
  }

  const sk = `Q#${questionId}#${askTimestamp}`;
  const putPromise = docClient
    .put({
      TableName: process.env.db,
      ConditionExpression: "attribute_not_exists(sk)",
      Item: {
        pk: `MEETING${meetingId}`,
        sk,
        classId,
        question,
        meta,
        teacher,
      },
    })
    .promise();

  let connections;

  try {
    [connections] = await Promise.all([
      queryUsers("student", meetingId),
      putPromise,
    ]);
  } catch (error) {
    return {
      statusCode: 404,
      reason: "Error at put question and query student connectionId",
      error,
    };
  }

  const studentPayload = {
    action: "receiveAsk",
    data: {
      avatar,
      askTimestamp,
      questionId,
      teacher,
      question,
      answerCrypt,
      meta,
    },
  };

  const teacherPayload = {
    action: "streamAsk",
    data: {
      avatar,
      askTimestamp,
      questionId,
      teacher,
      question,
      answer,
      meta,
    },
  };

  let numStudents = 0;
  const emitPromises = connections
    .filter((el) => el !== `CONN#STUDENT#${socket.id}`)
    .map(({ sk: el }) =>
      (async (role, userId) => {
        try {
          await socket.send(
            JSON.stringify(
              role === "TEACHER" ? teacherPayload : studentPayload
            ),
            userId
          );
          numStudents += 1;
        } catch {
          /// User forcefully disconnected
        }
      })(el.split("#")[1], el.split("#")[2])
    );

  try {
    await Promise.all(emitPromises);
  } catch (error) {
    return {
      statusCode: 404,
      reason: "Error at emitPromises",
      error,
    };
  }

  return {
    statusCode: 200,
    action: "numStudents",
    questionId,
    numStudents,
  };
};

module.exports = ask;
