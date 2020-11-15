const { AES } = require("../util/cryptojs");
const { docClient, queryUsers, emitForEach } = require("../util");

/**
 * Teacher action of asking a question to students, emits message to each student
 * @param {*} data
 * @param {*} socket
 */
const ask = async ({ meetingId, ...res }, socket) => {
  const { avatar, askTimestamp, questionId, ...putObject } = res;
  const message = { ...res };
  message.answer = AES.encrypt(message.answer, process.env.CRYPTO_SECRET);

  const sk = `Q#${questionId}#${askTimestamp}`;
  const putPromise = docClient
    .put({
      TableName: process.env.db,
      ExpressionAtrributeNames: {
        "#sk": sk,
      },
      ConditionExpression: "attribute_not_exists(#sk)",
      Item: {
        pk: `MEETING${meetingId}`,
        sk,
        ...putObject,
      },
    })
    .promise();

  const connections = (
    await Promise.all([queryUsers("student", meetingId), putPromise])
  )[0];

  const payload = { action: "receiveAsk", data: message };
  emitForEach(connections, payload, socket);
};

module.exports = ask;
