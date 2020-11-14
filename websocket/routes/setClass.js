const { docClient } = require("../util");

/**
 * Teacher action to assign the current meeting to a Class for persistent recording
 * @param {*} data
 * @param {*} socket
 */
const setClass = async ({ meetingId, userId, classId }) => {
  const UpdateParams = (sk) => ({
    Update: {
      TableName: process.env.db,
      Key: { pk: `MEETING#${meetingId}`, sk },
      ExpressionAttributeValues: { ":class": classId },
      UpdateExpression: "SET classId = :class",
    },
  });
  await docClient
    .transactWrite({
      TransactItems: [
        UpdateParams("META"),
        UpdateParams(`USER#TEACHER#${meetingId}#${userId}`),
      ],
    })
    .promise();
};

module.exports = setClass;
