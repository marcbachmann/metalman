# metalman

Composes configurable methods which are based on middlewares.


## Example method

```js
// Load middlewares
const schema = require('metalman-schema')
const action = require('metalman-action')
const command = require('metalman')([schema, action])

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
    // We like to keep it simple (and fast), so we can stream objects into those methods
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

```js
module.exports = schemaValidation

// The command config directly gets passed to the factory
function schemaValidation (commandConfig) {
  // In case the command doesn't need a middleware, just return a falsy value
  if (!commandConfig.schema) return
  const validator = require('ajv')(commandConfig.schema)

  return function (command, callback) {
    if (validator(command)) return callback()
    else return callback(new Error(JSON.stringify(validator.errors))
  }
}
```

## Example websocket server

Check out /examples/server.js and /examples/client.js

```js
const schema = require('metalman-schema')
const action = require('metalman-action')
const methodman = require('methodman')
const metalman = require('metalman')
const websocket = require('websocket-stream')

const command = metalman([schema, action])
const commands = {
  echo: command({
    schema: {type: 'string'},
    action: function (str, callback) {
      callback(null, str)
    }
  })
}

function onWebsocketStream (stream) {
  const meth = methodman(stream)
  meth.commands(commands)
}

const http = require('http')
const server = http.createServer(function (req, res) { res.end() })
websocket.createServer({server}, onWebsocketStream)

const port = process.env.PORT || 0
server.listen(port, function (err) {
  if (err) return console.error(err)
  console.log('Listening on http://localhost:%s', server.address().port)
})
```
