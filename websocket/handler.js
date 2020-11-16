const { typeCheck } = require("./util/type-check/lib");

const handler = async (data, socket, fn, schema, options) => {
  let response;
  try {
    if (!typeCheck(schema, data, options))
      response = {
        statusCode: 400,
        reason: `TypeCheck failed: Expected schema ${schema}, Found data ${data} and type ${typeof data}`,
      };
    else response = await fn(data, socket);
  } catch (e) {
    response = { statusCode: 500, error: e };
  }
  await socket.send(
    JSON.stringify({
      action: "response",
      ...response,
    }),
    socket.id
  );
};

module.exports = handler;
