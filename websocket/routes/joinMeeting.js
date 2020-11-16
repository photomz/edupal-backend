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
  console.log("reached joinMeeting");
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
          user: { id: userId, name },
          connectedAt: now,
        },
      })
      .promise(),
    docClient
      .put({
        // Class Meta
        TableName: process.env.db,
        // ExpressionAttributeNames: { "#sk": "META" },
        // ConditionExpression: "attribute_not_exists(#sk)",
        Item: {
          pk,
          sk: "META",
          time: { start: now, end: null },
          // Value for GSI keys must be non-empty string, strongly typed
          classId: "null",
        },
      })
      .promise(),
    docClient
      .put({
        // User Information
        TableName: process.env.db,
        // ExpressionAttributeNames: {
        //   "#sk": `USER#${role}#${meetingId}#${userId}`,
        // },
        // ConditionExpression: "attribute_not_exists(#sk)",
        Item: {
          pk,
          sk: `USER#${role}#${meetingId}#${userId}`,
          classId: "null",
          coinTotal: 0,
          name,
          gamification: { correctStreak: 0 },
        },
      })
      .promise(),
  ];

  console.log("reached put definitions");

  await Promise.all(batchConditionalPut);

  console.log("reached put responses");
  const getParams = {
    TableName: process.env.db,
    Key: { pk, sk: "META" },
    ProjectionExpression: "classId",
  };

  const { classId } = (await docClient.get(getParams).promise()).Item;
  console.log("reached get response");
  if (classId !== "null") {
    const payload = { action: "getClass", data: { classId } };
    try {
      console.log("reached socket.send");
      await send(JSON.stringify(payload), connectionId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }
  return {
    statusCode: 200,
  };
};

module.exports = joinMeeting;
