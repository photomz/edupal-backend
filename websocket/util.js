const { typeCheck } = require("type-check");
const AWS = require("aws-sdk");

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

module.exports = {
  docClient,
  typed,
};
