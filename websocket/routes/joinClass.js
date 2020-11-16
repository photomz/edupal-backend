const { docClient } = require("../util");

/**
 * Student action to join the set class in the meeting by the teacher
 * Lets Edupal record and persist data after meeting ends for dashboard
 * @param {*} data
 */
const joinClass = async ({ meetingId, userId, classId, name }) => {
  // No transactwrite because user info may exist if user drops off from call
  const sk = `USER#STUDENT#${meetingId}#${userId}`;
  const batchConditionalPut = [
    docClient
      .update({
        // Meeting PK
        TableName: process.env.db,
        Key: { pk: `MEETING#${meetingId}`, sk },
        ExpressionAttributeValues: { ":class": classId },
        ConditionExpression: "attribute_exists(sk)",
        UpdateExpression: "SET classId = :class",
      })
      .promise(),
    docClient
      .put({
        // Create Class PK if new user
        TableName: process.env.db,
        ConditionExpression: "attribute_not_exists(sk)",
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

  try {
    await Promise.all(batchConditionalPut);
  } catch (error) {
    // Conditional request failure is expected behaviour when not new user
    if (error.message !== "The conditional request failed")
      return {
        statusCode: 404,
        reason: "Error at batchConditionalPut",
        error,
      };
  }

  return {
    statusCode: 200,
  };
};

module.exports = joinClass;
