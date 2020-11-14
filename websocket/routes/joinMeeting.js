const { docClient } = require("../util");

/**
 * Automatically triggered upon entering Google Meet meeting
 * Adds ConnectionID to table and create temporary leaderboard
 * Subscribes user to messages in meeting
 * Inits meeting META if first meeting joiner
 * Emits getClass if classId not null
 * @param {*} data
 * @param {*} socket
 */
const joinMeeting = async (
  { meetingId, role, userId, name },
  { send, id: connectionId }
) => {
  const now = new Date().toISOString();
  const pk = `MEETING#${meetingId}`;
  // No transactwrite because user info may exist if user drops off from call
  const batchConditionalPut = [
    docClient
      .put({
        // Connection
        TableName: process.env.db,
        Item: {
          pk,
          sk: `CONN#${role}#${connectionId}`,
          userId,
          connectedAt: now,
        },
      })
      .promise(),
    docClient
      .put({
        // Class Meta
        TableName: process.env.db,
        ExpressionAttributeNames: { "#sk": "META" },
        ConditionExpression: "attribute_not_exists(#sk)",
        Item: {
          pk,
          sk: "META",
          time: { start: now, end: null },
          classId: null,
        },
      })
      .promise(),
    docClient
      .put({
        // User Information
        TableName: process.env.db,
        ExpressionAttributeNames: {
          "#sk": `USER#${role}#${meetingId}#${userId}`,
        },
        ConditionExpression: "attribute_not_exists(#sk)",
        Item: {
          pk,
          sk: `USER#${role}#${meetingId}#${userId}`,
          classId: null,
          coinTotal: 0,
          name,
          gamification: { correctStreak: 0 },
        },
      })
      .promise(),
  ];

  await Promise.all(batchConditionalPut);

  const getParams = {
    TableName: process.env.db,
    Key: { pk, sk: "META" },
    ProjectionExpression: "classId",
  };

  const { classId } = (await docClient.get(getParams).promise()).Item;

  if (classId !== null) {
    const payload = { action: "getClass", data: { classId } };
    try {
      await send(JSON.stringify(payload), connectionId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }
};

module.exports = joinMeeting;
