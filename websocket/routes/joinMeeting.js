const { docClient } = require("../util");

/**
 * Automatically triggered upon entering Google Meet meeting
 * Adds ConnectionID to table and create temporary leaderboard
 * Subscribes user to messages in meeting
 * @param {*} data
 * @param {*} socket
 */
const joinMeeting = async (
  { meetingId, role, userId },
  { id: connectionId }
) => {
  const params = {
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
  };

  await docClient.put(params).promise();
};

module.exports = joinMeeting;
