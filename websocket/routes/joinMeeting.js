const { docClient } = require("../util");

/**
 * Automatically triggered upon entering Google Meet meeting
 * Adds ConnectionID to table and create temporary leaderboard
 * Subscribes user to messages in meeting
 * @param {*} data
 * @param {*} socket
 */
const joinMeeting = async (
  { meetingId, role, userId, name },
  { id: connectionId }
) => {
  // No transactwrite because user info may exist if user drops off from call
  const batchConditionalPut = [
    docClient
      .put({
        // Connection
        TableName: process.env.db,
        ExpressionAttributeNames: {
          "#sk": "META",
        },
        ConditionExpression: "attribute_not_exists(#sk)",
        Item: {
          pk: `MEETING#${meetingId}`,
          sk: `CONN#${role}#${connectionId}`,
          userId,
          connectedAt: new Date().toISOString(),
        },
      })
      .promise(),
    docClient
      .put({
        // User Information
        TableName: process.env.db,
        ExpressionAttributeNames: {
          "#sk": `USER#${role}`,
        },
        ConditionExpression: "attribute_not_exists(#sk)",
        Item: {
          pk: `MEETING#${meetingId}`,
          sk: `USER#${role}#${userId}`,
          classId: null,
          coinTotal: 0,
          name,
          gamification: { correctStreak: 0 },
        },
      })
      .promise(),
  ];

  await Promise.all(batchConditionalPut);
};

module.exports = joinMeeting;
