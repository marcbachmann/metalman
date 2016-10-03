module.exports = metalman

function metalman (opts) {
  if (Array.isArray(opts)) opts = {middlewares: opts}
  else if (!opts) opts = {}
  if (!opts.middlewares) opts.middlewares = []

  return function registerCommand (config) {
    return commandFactory(config, opts)
  }
}

function commandFactory (config, opts) {
  var commandMiddlewares = opts.middlewares
    .map(createMiddlewares(config, opts))
    .filter(Boolean)

  return function executeCommand (command, done) {
    var callbacked = false
    var callback = function (err, result) {
      if (callbacked) return
      callbacked = true
      if (err) done(err)
      else done(null, result)
    }
    var context = opts.context ? Object.create(opts.context) : Object.create(null)
    executeMiddleware(0, commandMiddlewares, context, command, callback)
  }
}

function createMiddlewares (config, opts) {
  return function (factory, index) {
    if (!factory) return
    else if (typeof factory !== 'function') {
      var m = `A middleware factory must be a function. The middleware with index ${index} isn't.`
      throw new Error(m)
    }
    var middleware = factory(config, opts)
    if (middleware) return middleware
  }
}

function executeMiddleware (current, middlewares, context, command, callback) {
  var m = middlewares[current]
  if (!m) return callback(null, command)

  function next (err, newCommand) {
    if (err) return callback(err)
    if (arguments.length === 2) command = newCommand
    executeMiddleware(current + 1, middlewares, context, command, callback)
  }

  middlewares[current].call(context, command, next)
}
