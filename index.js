const {promisify, callbackify} = require('./util')

module.exports = metalman

function metalman (conf) {
  if (typeof conf !== 'object') {
    throw new Error('metalman(middlewares): A middleware array is required.')
  }

  const opts = {
    context: conf.context || null,
    middlewares: Array.isArray(conf) ? conf : conf.middlewares || []
  }

  function registerCommand (config) {
    return commandFactory('execute', config, opts)
  }

  function createDefineInstance () {
    const commands = {}
    Object.defineProperty(commands, 'define', {
      enumerable: false,
      writable: false,
      value: function defineCommand (name, config) {
        commands[name] = commandFactory(name, config, opts)
        return commands
      }
    })
    return commands
  }

  registerCommand.define = function defineCommandObject (name, config) {
    return createDefineInstance().define(name, config)
  }

  registerCommand.object = function createCommandObject (methods) {
    const commands = createDefineInstance()
    for (const methodName of Object.keys(methods)) {
      commands.define(methodName, methods[methodName])
    }
    return commands
  }

  return registerCommand
}

function commandFactory (functionName, config, opts) {
  const commandMiddlewares = opts.middlewares
    .map(instantiateMiddleware)
    .filter(Boolean)

  function instantiateMiddleware (factory, index) {
    if (!factory) return
    if (typeof factory === 'function') {
      if (!factory.name) {
        Object.defineProperty(factory, 'name', {
          value: `<anonymous middleware>`
        })
      }

      let middleware = factory(config, opts)
      if (!middleware) return

      if (!middleware.name) {
        Object.defineProperty(middleware, 'name', {
          value: `${factory.name}.handler`
        })
      }

      if (middleware.length >= 2) middleware = promisify(middleware)
      return middleware
    }

    throw new Error(
      `A middleware factory must be a function. ` +
      `The middleware with index ${index} isn't.\n` +
      `Value: ${JSON.stringify(factory)}`
    )
  }

  const executeCommandCallbackified = callbackify(executeCommand)
  async function executeCommand (req, cb) {
    let res
    for (const middleware of commandMiddlewares) {
      try {
        let val = middleware.call(this, req)
        if (val && val.then) val = await val
        if (val !== undefined) res = req = val
      } catch (err) {
        throw err
      }
    }
    return res
  }

  function execute (ctx, cb) {
    if (cb) return executeCommandCallbackified.call(this, ctx, cb)
    return executeCommand.call(this, ctx)
  }

  Object.defineProperty(execute, 'name', {value: functionName})
  return execute
}

// The action middleware
// use it like this:
//   const metalman = require('metalman')
//   const commands = metalman([metalman.action])
metalman.action = function actionMiddleware (config) {
  return config.action
}

// A tiny example about how to inject functions that always get executed
// use it like this:
//   const metalman = require('metalman')
//   function someVerification (cmd) { throw new Error('Invalid Command') }
//   const commands = metalman([metalman.use(someVerification)])
metalman.use = function useMiddleware (func) {
  return func
}
