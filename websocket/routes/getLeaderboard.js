const { docClient } = require("../util");

/**
 * HTTP-like action of getting leaderboard info for given meeting
 * @param {*} data
 * @param {*} socket
 */
const getLeaderboard = async ({ meetingId }) => {
  const leaderboardParams = {
    TableName: process.env.db,
    IndexName: "LeaderboardIndex",
    ExpressionAttributeValues: {
      ":pk": `MEETING#${meetingId}`,
    },
    ExpressionAttributeNames: {
      "#name": "name",
    },
    KeyConditionExpression: "pk = :pk",
    ScanIndexForward: false,

    ProjectionExpression:
      "#name, sk, avatar, coinTotal, gamification, coinChange",
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
    ({ sk, gamification, coinChange, name, avatar, coinTotal }) => ({
      name,
      id: sk.split("#")[sk.split("#").length - 1],
      avatar,
      points: coinTotal,
      streak: gamification.correctStreak,
      change: coinChange,
    })
  );

  return {
    statusCode: 200,
    action: "receiveLeaderboard",
    data,
  };
};

module.exports = getLeaderboard;
