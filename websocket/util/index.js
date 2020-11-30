const AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.AWS_REGION,
});
const docClient = new AWS.DynamoDB.DocumentClient();

/**
 * Query all connected students or teachers in meeting
 * Internal function to emit action to "everyone else"
 * @param {*} role
 * @param {*} meeting
 * @returns {Array<string>}
 */
const queryUsers = async (role, meetingId) => {
  const skStart =
    // eslint-disable-next-line no-nested-ternary
    role === "student"
      ? "CONN#STUDENT#"
      : role === "teacher"
      ? "CONN#TEACHER#"
      : "CONN#";

  const response = await docClient
    .query({
      TableName: process.env.db,
      ExpressionAttributeValues: {
        ":pk": `MEETING#${meetingId}`,
        ":sk": skStart,
      },
      KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
      ProjectionExpression: "sk",
    })
    .promise();

  return response.Items;
};

/**
 * Emit a message for each connection
 * Filters out sender
 * @param {Array<string>} connections
 * @param {*} payload
 * @param {*} socket
 * @param {String} exception
 */
const emitForEach = async (connections, payload, socket, sender) => {
  const cleanedConnections = connections.map(
    ({ sk }) => sk.split("#")[sk.split("#").length - 1]
  );
  const disconnectedIds = [];
  const emitPromises = cleanedConnections
    .filter((el) => el !== sender)
    .map((el) =>
      (async (id) => {
        try {
          await socket.send(JSON.stringify(payload), id);
        } catch {
          disconnectedIds.push(id);
        }
      })(el)
    );
  await Promise.all(emitPromises);

  if (disconnectedIds.length)
    // eslint-disable-next-line no-console
    console.info(`socket.sends failed for ${disconnectedIds}`);
};

/**
 * Queries DB to check whether any teachers exist
 * @param {String} meetingId
 * @returns The items to the query
 */
const doesTeacherExist = async (meetingId) =>
  (
    await docClient
      .query({
        TableName: process.env.db,
        ExpressionAttributeValues: {
          ":pk": `MEETING#${meetingId}`,
          ":sk": `USER#TEACHER#${meetingId}#`,
        },
        ExpressionAttributeNames: {
          "#name": "name",
        },
        KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
        ProjectionExpression: "#name, sk",
      })
      .promise()
  ).Items;

module.exports = {
  docClient,
  queryUsers,
  emitForEach,
  doesTeacherExist,
};
