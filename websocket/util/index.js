const AWS = require("aws-sdk");
const { typeCheck } = require("./type-check");

AWS.config.update({
  region: process.env.AWS_REGION,
});
const docClient = new AWS.DynamoDB.DocumentClient();

/**
 * Performs type checking and rejects if data does not adhere to schema
 * @param {String} schema
 * @param {*} vari
 * @param {*} options
 */
const typed = (schema, vari, options) => {
  const varname = Object.keys({ vari })[0];
  if (!typeCheck(schema, vari, options))
    throw new Error(
      `Expected ${varname} to match schema ${schema} but found value ${vari} and type ${typeof vari}`
    );
};

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

  const response = await docClient.query({
    TableName: process.env.db,
    ExpressionAttributeValues: {
      ":pk": `MEETING#${meetingId}`,
      ":sk": skStart,
    },
    KeyConditionExpression: "pk = :pk and begins_with(sk, :sk)",
    ProjectionExpression: "sk",
  });

  return response.Items;
};

/**
 * Emit a message for each connection
 * @param {Array<string>} connections
 * @param {*} payload
 * @param {*} socket
 */
const emitForEach = async (connections, payload, socket) => {
  const cleanedConnections = connections.map(
    ({ sk }) => sk.split("#")[sk.split("#").length - 1]
  );
  const emitPromises = cleanedConnections.map((el) =>
    (async (id) => {
      try {
        await socket.send(payload, id);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("Message could not be sent - CLIENT DISCONNECTED");
      }
    })(el)
  );
  await Promise.all(emitPromises);
};

module.exports = {
  docClient,
  typed,
  queryUsers,
  emitForEach,
};
