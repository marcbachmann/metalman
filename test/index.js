var test = require('tape').test

test('initialization', function (t) {
  t.plan(4)
  t.equal(typeof require('../'), 'function')
  t.equal(typeof require('../')([]), 'function')

  t.throws(function () {
    require('../')()
  }, 'metalman(middlewares): A middleware array is required.')

  var command = require('../')([])
  t.equal(typeof command(), 'function')
})

test('noop', function (t) {
  t.plan(2)
  var command = require('../')([])
  var something = command()
  something('foo', function (err, data) {
    t.error(err)
    t.equal(data, 'foo')
  })
})

test('middleware', function (t) {
  t.plan(3)

  function middleware (config) {
    return function (cmd, cb) {
      t.equal(cmd, 'test', 'passes the argument')
      cb(null, 'response')
    }
  }

  var command = require('../')([middleware])
  var something = command()
  something('test', function (err, data) {
    t.error(err)
    t.equal(data, 'response')
  })
})
