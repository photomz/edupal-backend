/**
 * User action to join the set class in the meeting by the teacher
 * Lets Edupal record and persist data after meeting ends for dashboard
 * @param {*} data
 * @param {*} socket
 */
const ping = async (_, socket) => {
  try {
    await socket.send(JSON.stringify({ action: "PING" }), socket.id);
  } catch (err) {
    throw new Error(`Ping failed with id ${socket.id} at ${new Date()}`, err);
  }
};

module.exports = ping;
