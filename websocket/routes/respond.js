const { docClient, queryUsers, emitForEach } = require("../util");

/**
 * Student action of responding to question posed by teacher
 * Emits response to all teachers and notifies all students
 * Updates coinTotal and gamification streaks
 * @param {*} data
 * @param {*} socket
 */
const respond = async ({ meetingId, askTimestamp, ...res }, socket) => {
  const { avatar, askTimestamp, questionId, ...putObject } = res;
  const message = { ...res };
  delete message.meta.answer;

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

module.exports = respond;
