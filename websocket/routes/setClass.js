const { docClient } = require("../util");

/**
 * @param {*} data
 * @param {*} socket
 */
const setClass = async ({ meetingId, userId, classId }) => {
  const pk = `MEETING#${meetingId}`;
  const UpdateParams = (sk) => ({
    Update: {
      TableName: process.env.db,
      Key: { pk, sk },
      ExpressionAttributeValues: { ":class": classId },
      UpdateExpression: "SET classId = :class",
    },
  });
  await docClient
    .transactWrite({
      TransactItems: [UpdateParams(pk), UpdateParams(`USER#TEACHER#${userId}`)],
    })
    .promise();
};

module.exports = setClass;
