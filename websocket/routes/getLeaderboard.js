const { docClient } = require("../util");

/**
 * HTTP-like action of getting leaderboard info for given meeting
 * @param {*} data
 * @param {*} socket
 */
const getLeaderboard = async ({ meetingId }, socket) => {
  const leaderboardParams = {
    TableName: process.env.db,
    IndexName: "LeaderboardIndex",
    ExpressionAttributeValues: {
      ":pk": `MEETING#${meetingId}`,
    },
    KeyConditionExpression: "pk = :pk",
    ScanIndexForward: false,

    ProjectionExpression: "name sk avatar coinTotal gamification coinChange",
  };

  let queryResponse;
  try {
    queryResponse = (await docClient.query(leaderboardParams).promise()).Items;
  } catch (error) {
    return {
      statusCode: 404,
      reason: "Error at get ClassId",
      error,
    };
  }

  const data = queryResponse.map(
    (sk, gamification, coinChange, name, avatar, points) => ({
      name,
      id: sk.split("#").slice(sk.split("#").length - 1),
      avatar,
      points,
      streak: gamification.correctStreak,
      change: coinChange,
    })
  );

  const payload = { action: "receiveLeaderboard", data };
  try {
    await socket.send(JSON.stringify(payload), socket.id);
  } catch (error) {
    return {
      statusCode: 404,
      reason: "Error at socket.send, client disconnected",
      error,
    };
  }

  return {
    statusCode: 200,
  };
};

module.exports = getLeaderboard;
