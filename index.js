const {promisify, callbackify, wrapError} = require('./util')
const util = require('util')

module.exports = metalman

function metalman (conf) {
  if (typeof conf !== 'object') {
    throw new Error('metalman(middlewares): A middleware array is required.')
  }

  const opts = {
    middlewares: Array.isArray(conf) ? conf : conf.middlewares || [],
    defaults: conf.defaults || {}
  }

  function registerCommand (config) {
    return commandFactory('execute', opts.defaults, config, opts)
  }

  function createDefineInstance () {
    const commands = {}
    Object.defineProperty(commands, 'define', {
      enumerable: false,
      writable: false,
      value: function defineCommand (name, config) {
        commands[name] = commandFactory(name, opts.defaults, config, opts)
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
    // We want to have the `define` function removed once we expose
    // the api, so you can't call it anymore
    return {...commands}
  }

  return registerCommand
}

function commandFactory (functionName, defaults, config, opts) {
  if (config !== undefined && typeof config !== 'object') {
    throw new Error(
      `To instantiate a command, you must pass a 'config' parameter ` +
      `which must be an object.\n` +
      `You Provided: ${JSON.stringify(config)}`
    )
  }

  config = {...opts.defaults, ...config}

  const commandMiddlewares = opts.middlewares
    .map(instantiateMiddleware)
    .filter(Boolean)

  function instantiateMiddleware (middlewareFactory, index) {
    if (!middlewareFactory) return
    if (typeof middlewareFactory === 'function') {
      if (!middlewareFactory.name) {
        Object.defineProperty(middlewareFactory, 'name', {
          value: `<anonymous middleware>`
        })
      }

      let middleware = middlewareFactory(config, opts)
      if (!middleware) return

      if (!middleware.name) {
        Object.defineProperty(middleware, 'name', {
          value: `${middlewareFactory.name}.handler`
        })
      }

      if (middleware.length >= 2) middleware = promisify(middleware)
      return middleware
    }

    throw new Error(
      `A middleware factory must be a function, ` +
      `but the factory with index ${index} isn't.\n` +
      `You Provided: ${JSON.stringify(middlewareFactory)}`
    )
  }

  const executeCommandCallbackified = callbackify(executeCommand)
  async function executeCommand (req) {
    try {
      let res
      for (const middleware of commandMiddlewares) {
        let _res = middleware.call(this, req)
        if (_res && _res.then) _res = await _res
        if (_res !== undefined) res = req = _res
      }
      return res
    } catch (err) {
      throw wrapError(err)
    }
  }

  function execute (ctx, cb) {
    if (cb) return executeCommandCallbackified.call(this, ctx, cb)
    return executeCommand.call(this, ctx)
  }

  execute[util.promisify.custom] = executeCommand
  Object.defineProperty(execute, 'name', {value: functionName})
  return execute
}

// The action middleware
// use it like this:
//   const metalman = require('metalman')
//   const commands = metalman([metalman.action])
metalman.action = function actionMiddleware (config) {
  if (!config.action) return
  return config.action[util.promisify.custom] || config.action
}
