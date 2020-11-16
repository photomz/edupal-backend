const { docClient, queryUsers, emitForEach } = require("../util");

/**
 * Teacher action to assign the current meeting to a Class for persistent recording
 * Emits getClass to all students
 * @param {*} data
 * @param {*} socket
 */
const setClass = async ({ meetingId, userId, classId }, socket) => {
  const UpdateParams = (sk) => ({
    Update: {
      TableName: process.env.db,
      Key: { pk: `MEETING#${meetingId}`, sk },
      ExpressionAttributeValues: { ":class": classId },
      UpdateExpression: "SET classId = :class",
    },
  });

  const transactPromise = docClient
    .transactWrite({
      TransactItems: [
        UpdateParams("META"),
        UpdateParams(`USER#TEACHER#${meetingId}#${userId}`),
      ],
    })
    .promise();

  const connections = (
    await Promise.all([queryUsers("student", meetingId), transactPromise])
  )[0];

  const payload = { action: "getClass", data: { classId } };
  await emitForEach(connections, payload, socket, socket.id);

  return {
    statusCode: 200,
  };
};

module.exports = setClass;
