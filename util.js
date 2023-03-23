'use strict'
const util = require('util')

// A promisify method that
// - doesn't make always use of new Promise and therefore doesn't waste
//   any unnecessary ticks and also results in better stack traces.
// - Converts primitives to an error instance with a stack trace
// - Only supports exactly one argument as we don't need more in here
function promisify (action, _opts) {
  const opts = _opts || {}
  const originalAction = action[util.promisify.method]
  if (originalAction) return originalAction

  function promisified (cmd) {
    let deferrable, err, res

    function promisifiedCallbackMetalman (_err, _res) {
      if (deferrable) {
        if (_err) deferrable.reject(wrapError(_err))
        else deferrable.resolve(_res)
      } else {
        deferrable = false
        err = _err
        res = _res
      }
    }

    try {
      action.call(this, cmd, promisifiedCallbackMetalman)
      if (deferrable === undefined) {
        return new Promise((resolve, reject) => {
          deferrable = {resolve, reject}
        })
      }
    } catch (_err) {
      err = _err
    }

    if (err) throw wrapError(err)
    return res
  }

  const desc = Object.getOwnPropertyDescriptors(action)
  const name = desc.name.value || opts.name || '<anonymous>'
  desc.name.value = `${name} [as promisified]`
  desc.length.value = 1
  Object.defineProperties(promisified, desc)
  return promisified
}

function wrapError (maybeError) {
  if (typeof maybeError === 'object') return maybeError
  return new WrappedError(safeToString(maybeError))
}

class WrappedError extends Error {
  constructor (message) {
    super(message)
    Error.captureStackTrace(this, wrapError)
  }
}

Object.defineProperty(WrappedError, 'name', {value: 'Error'})

function safeToString (obj) {
  try {
    return `${obj}`
  } catch (e) {
    return '[no string representation]'
  }
}

module.exports = {
  promisify,
  callbackify: util.callbackify,
  wrapError
}
