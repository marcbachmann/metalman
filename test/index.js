const test = require('tap').test

const metalman = require('../')
const undefinedMiddleware = (config) => (cmd) => undefined
const echoMiddleware = (config) => (cmd) => cmd

test('initialization', async function (t) {
  t.equal(typeof metalman, 'function')
  t.equal(typeof metalman([]), 'function')

  t.throws(function () {
    metalman()
  }, 'metalman(middlewares): A middleware array is required.')

  const command = metalman([])
  t.equal(typeof command.define, 'function', 'exposes .define on the instance')
  t.equal(typeof command.object, 'function', 'exposes .object on the instance')
  t.equal(typeof command(), 'function', 'returns a function on command construction')
})

test('invocation using async/await', async function (t) {
  t.plan(2)

  const command = metalman([echoMiddleware])
  const something = command()

  const promise = something('someInput')
  t.equal(typeof promise.then, 'function')
  const data = await promise
  t.equal(data, 'someInput')
})

test('invocation using callbacks', function (t) {
  t.plan(3)
  const command = metalman([echoMiddleware])
  const something = command()

  const functionReturnValue = something('someInput', (err, data) => {
    t.error(err)
    t.equal(data, 'someInput')
  })

  t.equal(functionReturnValue, undefined, 'Returns undefined when using callback')
})

test('return values', async function (t) {
  const emptyCommands = metalman([])
  const emptyCommand = emptyCommands()
  const empty = await emptyCommand('Input')
  t.equal(empty, undefined, 'Returns undefined by default')

  const undefinedCommands = metalman([undefinedMiddleware])
  const undefinedCommand = undefinedCommands()
  const undef = await undefinedCommand('Input')
  t.equal(undef, undefined, 'Returns undefined when a middleware returns undefined')

  const echoCommands = metalman([echoMiddleware])
  const echoCommand = echoCommands()
  const echoed = await echoCommand('Input')
  t.equal(echoed, 'Input', 'Returns value when a middleware returns value')

  const keepCommands = metalman([echoMiddleware, undefinedMiddleware])
  const keepCommand = keepCommands()
  const retained = await keepCommand('Input')
  t.equal(retained, 'Input', 'Retains a value when a second middleware returns undefined')

  const actionCommands = metalman([metalman.action]).object({
    something: {
      action () { return undefined }
    },
    ping: {
      action () { return 'pong' }
    }
  })
  const noReturnValue = await actionCommands.something('Input')
  t.equal(noReturnValue, undefined, '.action Returns undefined when there is no response')

  const pong = await actionCommands.ping('Input')
  t.equal(pong, 'pong', '.action Returns value when there is a response')
})

test('middleware parameters', async function (t) {
  t.plan(3)

  function middleware (config) {
    t.equal(config.somekey, true, 'Passes down the config object to the middleware')
    return function middlewareHandler (cmd) {
      t.equal(cmd, 'test', 'passes the argument')
      return 'response'
    }
  }

  const command = metalman([middleware])
  const something = command({somekey: true})
  const data = await something('test')
  t.equal(data, 'response')
})

test('supports sync, async and callback middlewares', async function (t) {
  t.plan(3)

  function syncMiddleware (config) {
    return function (cmd) {
      return cmd
    }
  }

  function asyncMiddleware (config) {
    return async function (cmd) {
      return cmd
    }
  }

  function cbMiddleware (config) {
    return function (cmd, cb) {
      setTimeout(cb, 0, null, cmd)
    }
  }

  const syncMiddlewareCommand = metalman([syncMiddleware])
  const syncSomething = syncMiddlewareCommand()
  const somethingSync = await syncSomething('foo')
  t.equal(somethingSync, 'foo')

  const asyncMiddlewareCommand = metalman([asyncMiddleware])
  const asyncSomething = asyncMiddlewareCommand()
  const somethingAsync = await asyncSomething('foo')
  t.equal(somethingAsync, 'foo')

  const cbMiddlewareCommand = metalman([cbMiddleware])
  const cbSomething = cbMiddlewareCommand()
  const somethingCb = await cbSomething('foo')
  t.equal(somethingCb, 'foo')
})

test('returns with errors of middleware', function (t) {
  t.plan(3)

  const error = new Error('Something')

  function syncMiddleware (config) {
    return function (cmd) {
      throw error
    }
  }

  function asyncMiddleware (config) {
    return async function (cmd) {
      throw error
    }
  }

  function cbMiddleware (config) {
    return function (cmd, cb) {
      setTimeout(cb, 0, error)
    }
  }

  const syncMiddlewareCommand = metalman([syncMiddleware])
  const syncSomething = syncMiddlewareCommand()
  syncSomething(null, function (err) {
    t.equal(err, error)
  })

  const asyncMiddlewareCommand = metalman([asyncMiddleware])
  const asyncSomething = asyncMiddlewareCommand()
  asyncSomething(null, function (err) {
    t.equal(err, error)
  })

  const cbMiddlewareCommand = metalman([cbMiddleware])
  const cbSomething = cbMiddlewareCommand()
  cbSomething(null, function (err) {
    t.equal(err, error)
  })
})

test('retains the input value in middlewares when returning undefined', async function (t) {
  t.plan(1)

  function first (config) {
    return function (cmd, cb) { cb(null, `value with ${cmd}`) }
  }

  function second (config) {
    return function (cmd) { return undefined }
  }

  function third (config) {
    return async function (cmd) { return `retained ${cmd}` }
  }

  const asyncMiddlewareCommand = metalman([first, second, third])
  const execute = asyncMiddlewareCommand()
  const data = await execute('Input')
  t.equal(data, 'retained value with Input')
})
