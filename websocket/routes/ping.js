async (data, socket) => {
  try {
    await socket.send(JSON.stringify({ action: "PING" }), socket.id);
  } catch (err) {
    console.log("Ping failed - old DB");
  }
};
