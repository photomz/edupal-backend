// Must be invoked by extension - not automatic
if (data && data.id) {
  const params = {
    TableName: process.env.connectionDb,
    Key: {
      connectionID: { S: socket.id },
      meetingID: { S: data.id },
    },
  };
  try {
    await DDB.deleteItem(params).promise();
  } catch (error) {
    throw new Error("DISCONNECTION ERROR", error);
  }
}
