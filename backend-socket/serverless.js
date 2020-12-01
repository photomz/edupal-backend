const path = require('path')
const { Component, utils } = require('@serverless/core')

class BackendSocket extends Component {
  async default(inputs = {}) {
    this.context.status(`Deploying`)

    inputs.region = inputs.region || 'us-east-1'

    // Default to current working directory
    inputs.code = inputs.code || {}
    inputs.code.root = inputs.code.root ? path.resolve(inputs.code.root) : process.cwd()
    if (inputs.code.src) {
      inputs.code.src = path.join(inputs.code.root, inputs.code.src)
    }

    // Validate - Check for socket.js
    let exists
    if (inputs.code.src) {
      exists = await utils.fileExists(path.join(inputs.code.src, 'socket.js'))
    } else {
      exists = await utils.fileExists(path.join(inputs.code.root, 'socket.js'))
    }
    if (!exists) {
      throw new Error(`No "socket.js" file found in the current directory.`)
    }

    this.context.debug(`Deploying websockets backend to the ${inputs.region} region.`)

    // If a hook is provided, build the assets
    if (inputs.code.hook) {
      this.context.status('Building assets')
      this.context.debug(`Running ${inputs.code.hook} in ${inputs.code.root}.`)

      const options = { cwd: inputs.code.root }
      try {
        await exec(inputs.code.hook, options)
      } catch (err) {
        console.error(err.stderr) // eslint-disable-line
        throw new Error(
          `Failed building code via "${inputs.code.hook}" due to the following error: "${err.stderr}"`
        )
      }
    }

    this.context.status(`Deploying S3 Bucket`)
    this.context.debug(`Deploying s3 bucket for websockets backend code.`)

    // Create S3 Bucket
    const lambdaBucket = await this.load('@serverless/aws-s3')
    const lambdaBucketOutputs = await lambdaBucket({
      region: inputs.region
    })

    this.context.status(`Deploying Lambda Function`)
    this.context.debug(`Deploying AWS Lambda Function for websockets backend.`)

    // make sure user does not overwrite the following
    inputs.runtime = 'nodejs10.x'
    inputs.handler = 'shim.socket'
    inputs.shims = [path.resolve(__dirname, './shim.js')]
    inputs.routeSelectionExpression = '$request.body.route'
    inputs.service = 'lambda.amazonaws.com'
    inputs.description = inputs.description || 'Serverless Socket'
    inputs.bucket = lambdaBucketOutputs.name

    // Modify code input to fit AWS Lambda Component's code input
    inputs.code = inputs.code.src || input.code.root

    const lambda = await this.load('@serverless/aws-lambda')
    const lambdaOutputs = await lambda(inputs)

    inputs.routes = {
      $connect: lambdaOutputs.arn,
      $disconnect: lambdaOutputs.arn,
      $default: lambdaOutputs.arn
    }

    this.context.status(`Deploying WebSockets Interface`)
    this.context.debug(`Deploying AWS Websockets on AWS API Gateway`)

    const websockets = await this.load('@serverless/aws-websockets')
    const websocketsOutputs = await websockets(inputs)

    this.state.region = inputs.region
    this.state.url = websocketsOutputs.url
    this.state.routes = Object.keys(websocketsOutputs.routes) || []
    await this.save()

    this.context.debug(
      `Socket with id ${websocketsOutputs.id} was successfully deployed to the ${
        inputs.region
      } region.`
    )
    this.context.debug(`Socket id ${websocketsOutputs.id} url is ${websocketsOutputs.url}.`)

    const outputs = {
      url: this.state.url,
      routes: this.state.routes
    }

    return outputs
  }

  async remove() {
    this.context.status(`Removing`)

    const lambda = await this.load('@serverless/aws-lambda')
    const websockets = await this.load('@serverless/aws-websockets')
    const lambdaBucket = await this.load('@serverless/aws-s3')

    await lambda.remove()
    await websockets.remove()
    await lambdaBucket.remove()

    this.state = {}
    await this.save()
    return {}
  }
}

module.exports = BackendSocket
