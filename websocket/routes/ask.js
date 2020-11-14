async (data, socket) => {
  const parsedData = JSON.parse(data);
  try {
    const connectionData = await DDBDoc.query({
      TableName: process.env.connectionDb,
      IndexName: "meetingIndex",
      ProjectionExpression: "connectionID",
      KeyConditionExpression: "meetingID = :meetingID",
      ExpressionAttributeValues: {
        ":meetingID": parsedData.message.id,
      },
    }).promise();
    const connections = connectionData.Items.filter(
      (item) => item.connectionID !== socket.id
    );
    for (const { connectionID } of connections) {
      try {
        await socket.send(data, connectionID);
      } catch (error) {
        console.log("Message could not be sent - CLIENT DISCONNECTED");
      }
    }
  } catch (error) {
    throw new Error(error);
  }
};
