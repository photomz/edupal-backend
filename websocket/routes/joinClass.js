const { docClient } = require("../util");

/**
 * User action to join the set class in the meeting by the teacher
 * Lets Edupal record and persist data after meeting ends for dashboard
 * @param {*} data
 */
const joinClass = async ({ meetingId, userId, classId, name }) => {
  // No transactwrite because user info may exist if user drops off from call
  const batchConditionalPut = [
    docClient
      .update({
        // Connection
        TableName: process.env.db,
        Key: { pk: `MEETING#${meetingId}`, sk: `USER#STUDENT#${userId}` },
        ExpressionAttributeValues: { ":class": classId },
        ExpressionAttributeNames: { "#sk": `USER#STUDENT#${userId}` },
        ConditionExpression: "attribute_exists(#sk)",
        UpdateExpression: "SET classId = :class",
      })
      .promise(),
    docClient
      .put({
        // User Information
        TableName: process.env.db,
        ExpressionAttributeNames: {
          "#sk": `USER#STUDENT#${userId}`,
        },
        ConditionExpression: "attribute_not_exists(#sk)",
        Item: {
          pk: `CLASS#${classId}`,
          sk: `USER#STUDENT#${userId}`,
          coinTotal: 0, // For actual logic must GET from meeting user info not zero
          name,
          powerupsBought: { x2Coin: 0, x3Coin: 0, freeze: 0, disruption: 0 },
          gamification: {
            correctStreak: 0,
            powerupApplied: { type: null, start: null },
          },
        },
      })
      .promise(),
  ];

  await Promise.all(batchConditionalPut);
};

module.exports = joinClass;
