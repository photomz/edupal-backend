const { docClient, emitForEach, queryUsers } = require("../util");

/**
 * Triggered by endpoint to manually disconnect
 * @param {*} data
 * @param {*} socket
 */
const disconnect = async ({ meetingId, role, userId, name, classId }) => {
  const now = new Date().toISOString();
  const params = [
    {
      Update: {
        TableName: process.env.db,
        Key: { pk: `MEETING#${meetingId}`, sk: `CONN${role.toUpperCase()}` },
        ExpressionAttributeValues: {
          ":now": now,
        },
        UpdateExpression: "SET time.end :now",
      },
    },
  ];
  if (role === "teacher")
    params.push({
      Update: {
        TableName: process.env.db,
        Key: { pk: `MEETING#${meetingId}`, sk: "META" },
        ExpressionAttributeValues: {
          ":now": now,
        },
        UpdateExpression: "SET time.end :now",
      },
    });

  await docClient.transactWrite(params).promise();

  // TODO: Stream-like logic to funnel meeting data and update to class
  // TODO: Actual stream on meeting time end update trigger for attendance
  console.log(`${userId} ${name} from ${classId} has disconnected`);
  // TODO: Cut websocket connection
  // TODO: Emit to teachers and student of disconnection
};

module.exports = disconnect;
