/**
 * Ping websocket connection to keep alive
 * @param {*} _
 * @param {*} socket
 */
const ping = async (_, socket) => {
  try {
    await socket.send(JSON.stringify({ action: "ping" }), socket.id);
  } catch (err) {
    throw new Error(`Ping failed with id ${socket.id} at ${new Date()}`, err);
  }
};

module.exports = ping;
