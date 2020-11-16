const { docClient } = require("../util");

/**
 * Triggered by endpoint to manually disconnect
 * @param {*} data
 * @param {*} socket
 */
const disconnect = async (
  { meetingId, role, userId, name, classId },
  { id }
) => {
  if (!meetingId) {
    console.log(`Connection ${id} has disconnected forcefully`);
    return {
      statusCode: 200,
      message: "You have forcefully disconnected. This is not recommended.",
    };
  }
  const now = new Date().toISOString();
  const params = [
    {
      Delete: {
        TableName: process.env.db,
        Key: {
          pk: `MEETING#${meetingId}`,
          sk: `CONN#${role.toUpperCase()}#${id}`,
        },
      },
    },
    {
      Update: {
        TableName: process.env.db,
        Key: { pk: `MEETING#${meetingId}`, sk: "META" },
        ExpressionAttributeValues: {
          ":decr": -1,
        },
        UpdateExpression: "ADD activeConnections :decr",
      },
    },
  ];

  await docClient.transactWrite({ TransactItems: params }).promise();

  // TODO: Stream-like logic to funnel meeting data and update to class
  // TODO: Actual stream on activeConnections 0 trigger (with ReturnValue) for attendance
  // eslint-disable-next-line no-console
  console.log(`${userId} ${name} from ${classId} has disconnected gracefully`);
  // TODO: Cut websocket connection
  // TODO: Emit to teachers and student of disconnection

  return {
    message: `You have disconnected gracefully at ${now}`,
    statusCode: 200,
  };
};

module.exports = disconnect;
