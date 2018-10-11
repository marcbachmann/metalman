module.exports = metalman

function metalman (conf) {
  if (typeof conf !== 'object') {
    throw new Error('metalman(middlewares): A middleware array is required.')
  }

  var opts = {
    context: conf.context || null,
    middlewares: Array.isArray(conf) ? conf : conf.middlewares || []
  }

  return function registerCommand (config) {
    return commandFactory(config, opts)
  }
}

metalman.commands = function (opts) {
  var all = {}
  var middlewares = []
  var command = metalman(middlewares)

  var api = {
    use: function (middleware) {
      middlewares.push(middleware)
    },
    call: function (name, cmd, callback) {
      all[name](cmd, callback)
    },
    expose: function () {
      return all
    },
    define: function (name, config) {
      config.name = name
      all[name] = command(config)
      return api
    }
  }

  return api
}

function commandFactory (config, opts) {
  var commandMiddlewares = opts.middlewares
    .map(createMiddlewares(config, opts))
    .filter(Boolean)

  return function executeCommand (command, done) {
    var callbacked = false
    function callback (err, result) {
      if (callbacked) return
      callbacked = true
      if (err) done(err)
      else done(null, result)
    }
    var context = opts.context ? Object.create(opts.context) : Object.create(null)
    executeMiddleware(commandMiddlewares, 0, context, command, callback)
  }
}

function createMiddlewares (config, opts) {
  return function executeMiddlewares (factory, index) {
    if (!factory) return
    else if (typeof factory !== 'function') {
      var m = `A middleware factory must be a function. The middleware with index ${index} isn't.`
      throw new Error(m)
    }
    var middleware = factory(config, opts)
    if (middleware) return middleware
  }
}

function executeMiddleware (middlewares, current, context, command, callback) {
  if (!middlewares[current]) return callback(null, command)

  function next (err, newCommand) {
    if (err) return callback(err)
    if (arguments.length === 2) command = newCommand
    executeMiddleware(middlewares, current + 1, context, command, callback)
  }

  middlewares[current].call(context, command, next)
}
