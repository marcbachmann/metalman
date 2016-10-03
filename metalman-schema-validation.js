module.exports = validateSchemaMiddleware

function validateSchemaMiddleware (config) {
  if (typeof config.schema !== 'object') return

  var ajv = new (require('ajv'))({ useDefaults: true })
  var validator = ajv.compile(config.schema)

  return function (cmd, next) {
    if (validator(cmd)) return next()
    return next(new ValidationError(validator.errors))
  }
}

require('util').inherits(ValidationError, Error)
function ValidationError (errors) {
  this.message = undefined
  this.name = this.constructor.name
  this.errors = errors.map(function (e) {
    return {
      keyword: e.keyword,
      message: e.message,
      params: e.params,
      dataPath: e.dataPath
    }
  })
  Error.call(this)
  Error.captureStackTrace(this, this.constructor)
}
