# metalman

Composes configurable methods which are based on middlewares.


## Example method

```
// Load middlewares
var validateSchema = require('metalman/metalman-schema-validation')
var executeCommand = require('metalman/metalman-command-execution')
var command = require('metalman')([validateSchema, executeCommand])

module.exports = {
  createUser: command({
    schema: {
      required: ['id', 'name'],
      properties: {
        id: {type: 'string', maxLength: 36},
        name: {type: 'string'}
      }
    },

    // This middleware framework only supports
    // one input argument and a callback
    // We like to keep it simple, so we can stream objects into those methods
    action: function (cmd, cb) {
      // cmd.id is definitely a string
      // cmd.name is also a string

      // By returning a second argument, you're defining the return value
      // Attention all following middlewares receive that object
      // In case you'd like to keep your input object, set it to this.something
      cb(null, {id: cmd.id, name: cmd.name})
    }
  })
}

// module.exports.createUser({id: 'some-id', name: 'foobar'}, console.log)
```


## Example middleware

```
module.exports = schemaValidation

// The command config directly gets passed to the factory
function schemaValidation (commandConfig) {
  // In case the command doesn't need a middleware, just return a falsy value
  if (!commandConfig.schema) return
  var validator = require('ajv')(commandConfig.schema)

  return function (command, callback) {
    if (validator(command)) return callback()
    else return callback(new Error(JSON.stringify(validator.errors))
  }
}
```
