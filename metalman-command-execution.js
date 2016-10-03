module.exports = commandMiddlewareFactory

function commandMiddlewareFactory (config) {
  var action = config.action
  if (!action) return

  return function executeCommandMiddleware (command, callback) {
    try {
      action.call(this, command, next)
    } catch (err) {
      return callback(err)
    }

    function next (err, res) {
      setImmediate(function () {
        if (err) callback(err)
        else callback(null, res)
      })
    }
  }
}
