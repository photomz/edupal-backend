/**
 * Ping websocket connection to keep alive
 * @param {*} _
 * @param {*} socket
 */
const ping = async () => ({
  action: "ping",
  statusCode: 200,
});

module.exports = ping;
