const { docClient, doesTeacherExist } = require("../util");

/**
 * Automatically triggered upon entering Google Meet meeting
 * Rejects if role is teacher and teacher already exists
 * Adds socket.id to table and create temporary leaderboard
 * Subscribes user to messages in meeting
 * Inits meeting META if first meeting joiner
 * Emits getClass if classId not null
 * @param {*} data
 * @param {*} socket
 */
const joinMeeting = async (
  { meetingId, role, userId, name, avatar },
  socket
) => {
  if (role === "TEACHER") {
    const teacherQuery = await doesTeacherExist(meetingId);

    if (teacherQuery.length) {
      const payload = {
        action: "joinMeetingFailed",
        data: {
          message: `You can not join as teacher because ${teacherQuery[0].name} is currently the teacher. Ask ${teacherQuery[0].name} to give up their role as teacher or join as student and try again.`,
        },
      };
      try {
        await socket.send(JSON.stringify(payload), socket.id);
      } catch {
        // About to return error anyways
      }
      return { statusCode: 404 };
    }
  }

  const now = new Date().toISOString();
  const pk = `MEETING#${meetingId}`;
  // No transactwrite because user info may exist if user drops off from call
  let UserItem = {
    pk,
    sk: `USER#${role}#${meetingId}#${userId}`,
    classId: "null",
    name,
    avatar,
  };
  if (role === "STUDENT")
    UserItem = {
      ...UserItem,
      coinTotal: 0,
      gamification: { correctStreak: 0 },
      coinChange: 0,
    };

  const batchConditionalPut = [
    docClient
      .put({
        // User Information
        TableName: process.env.db,
        ConditionExpression: "attribute_not_exists(sk)",
        Item: UserItem,
      })
      .promise(),
    docClient
      .put({
        // Connection
        TableName: process.env.db,
        Item: {
          pk,
          sk: `CONN#${role}#${socket.id}`,
          user: { id: userId, name },
          connectedAt: now,
        },
      })
      .promise(),
    docClient
      .put({
        // Class META init setup
        TableName: process.env.db,
        ConditionExpression: "attribute_not_exists(sk)",
        Item: {
          pk,
          sk: "META",
          time: { start: now, end: null },
          // Value for GSI keys must be non-empty string, strongly typed
          classId: "null",
          activeConnections: 1,
        },
      })
      .promise(),
  ];

  try {
    await Promise.all(batchConditionalPut);
  } catch (error) {
    // Conditional request expected to fail when not init
    if (error.message !== "The conditional request failed")
      return {
        statusCode: 404,
        reason: "Error at batchConditionalPut",
        error,
      };
  }

  const getParams = {
    TableName: process.env.db,
    Key: { pk, sk: "META" },
    ProjectionExpression: "classId",
  };

  let classId;

  try {
    classId = (await docClient.get(getParams).promise()).Item.classId;
  } catch (error) {
    return {
      statusCode: 404,
      reason: "Error at get ClassId",
      error,
    };
  }

  try {
    await socket.send(
      JSON.stringify({ action: "joinMeetingSuccess" }),
      socket.id
    );
  } catch (error) {
    return { statusCode: 404 };
  }

  if (classId !== "null") {
    const payload = { action: "getClass", data: { classId } };
    try {
      await socket.send(JSON.stringify(payload), socket.id);
    } catch (error) {
      return { statusCode: 404 };
    }
  }

  return {
    statusCode: 200,
  };
};

module.exports = joinMeeting;
