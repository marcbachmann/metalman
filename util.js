module.exports = {promisify, callbackify: require('util').callbackify}

// A promisify method that
// - doesn't make use of new Promise and therefore doesn't waste
//   any unnecessary ticks and also results in better stack traces.
// - Converts primitives to an error instance with a stack trace
// - Only supports exactly one argument as we don't need more in here
function promisify (action) {
  function promisified (cmd) {
    let thenable
    let err, res
    try {
      let sameTick
      action.call(this, cmd, function promisifiedCallback (_err, _res) {
        if (sameTick === false) {
          if (_err) return thenable.reject(new WrappedError(_err))
          return thenable.resolve(_res)
        } else {
          sameTick = true
          err = _err
          res = _res
        }
      })

      if (sameTick === undefined) {
        sameTick = false
        thenable = new Thenable()
        return thenable
      }
    } catch (_err) {
      err = _err
    }

    if (err) throw new WrappedError(err)
    return res
  }

  Object.defineProperty(promisified, 'name', {value: `${action.name} [as promisified]`})
  return promisified
}

class WrappedError extends Error {
  constructor (maybeError) {
    if (!isPrimitive(maybeError)) return maybeError
    super(safeToString(maybeError))
  }
}

Object.defineProperty(WrappedError, 'name', {value: 'Error'})

class Thenable {
  constructor () {
    this.resolve = undefined
    this.reject = undefined
  }

  then (resolve, reject) {
    this.resolve = resolve
    this.reject = reject
  }
}

function isPrimitive (val) {
  return val == null || val === true || val === false ||
    typeof val === 'string' || typeof val === 'number'
}

function safeToString (obj) {
  try {
    return obj + ''
  } catch (e) {
    return '[no string representation]'
  }
}
