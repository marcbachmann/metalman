const test = require('tape').test

test('initialization', function (t) {
  t.plan(4)
  t.equal(typeof require('../'), 'function')
  t.equal(typeof require('../')([]), 'function')

  t.throws(function () {
    require('../')()
  }, 'metalman(middlewares): A middleware array is required.')

  const command = require('../')([])
  t.equal(typeof command(), 'function')
})

test('returns undefined by default', async function (t) {
  t.plan(1)
  const command = require('../')([])
  const execute = command()
  const data = await execute('Input')
  t.equal(data, undefined)
})

test('returns last value that got returned', async function (t) {
  t.plan(1)
  function first (config) {
    return function (cmd) { return 'Hello' }
  }
  function second (config) {
    return function (cmd) { return undefined }
  }
  const command = require('../')([first, second])
  const execute = command()
  const data = await execute('Input')
  t.equal(data, 'Hello')
})

test('middleware', function (t) {
  t.plan(3)

  function middleware (config) {
    return function (cmd, cb) {
      t.equal(cmd, 'test', 'passes the argument')
      cb(null, 'response')
    }
  }

  const command = require('../')([middleware])
  const something = command()
  something('test', function (err, data) {
    t.error(err)
    t.equal(data, 'response')
  })
})

test('supports async middlewares', function (t) {
  t.plan(2)
  function middleware (config) {
    return async function someMiddleware (cmd) {
      return cmd
    }
  }

  const command = require('../')([middleware])
  const something = command()
  something('someInput', function (err, data) {
    t.error(err)
    t.equal(data, 'someInput')
  })
})

test('supports invocation using async/await', async function (t) {
  t.plan(1)
  function middleware (config) {
    return async function someMiddleware (cmd) {
      return cmd
    }
  }

  const command = require('../')([middleware])
  const something = command()
  const data = await something('someInput')
  t.equal(data, 'someInput')
})

test('returns with errors of middleware', function (t) {
  t.plan(2)

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

  const syncMiddlewareCommand = require('../')([syncMiddleware])
  const syncSomething = syncMiddlewareCommand()
  syncSomething(null, function (err) {
    t.equal(err, error)
  })

  const asyncMiddlewareCommand = require('../')([asyncMiddleware])
  const asyncSomething = asyncMiddlewareCommand()
  asyncSomething(null, function (err) {
    t.equal(err, error)
  })
})

test('retains the input value in middlewares when undefined', async function (t) {
  t.plan(1)

  function first (config) {
    return function (cmd) { return undefined }
  }

  function second (config) {
    return async function (cmd) { return `retained ${cmd}` }
  }

  const asyncMiddlewareCommand = require('../')([first, second])
  const execute = asyncMiddlewareCommand()
  const data = await execute('Input')
  t.equal(data, 'retained Input')
})
