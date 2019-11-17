# metalman

[![Greenkeeper badge](https://badges.greenkeeper.io/marcbachmann/metalman.svg)](https://greenkeeper.io/)

A recursion-free middleware framework for composable methods with native promise support.


## Example method

```js
const metalman = require('metalman')

// Load middlewares
// registers a `schema` handler, check the `schema` attribute in the example below
const schema = require('metalman-schema')

// registers an `action` handler, check the `action` attribute in the example below
// Basically it just proxies the `action` attribute of a command to the middleware factory
//   e.g. `function action (command) { return command.action }`
const action = metalman.action

// Pass the middlewares to the command factory
const command = metalman([schema, metalman.action])

module.exports = {
  doSomething: command({
    async action (cmd) {
      return somethingAsync(cmd)
    }
  }),
  createUser: command({
    schema: {
      required: ['id', 'name'],
      properties: {
        id: {type: 'string', maxLength: 36},
        name: {type: 'string'}
      }
    },

    // This middleware framework only supports
    // one input argument and an optional callback
    // We like to keep it simple (and fast), so we can stream objects into those methods
    action (cmd) {
      // cmd.id is definitely a string
      // cmd.name is also a string

      // By returning a value, you can change what gets passed
      // into the next middleware as input parameter.
      // If you don't need to change the output parameter,
      // and just go to the next middleware, you can return `undefined`
      return {id: cmd.id, name: cmd.name}
    }
  })
}

// module.exports.createUser({id: 'some-id', name: 'foobar'}, console.log)
```


## Api

### metalman([middlewares])

Instatiates a new object where you can pass some middlewares.
```js
const metalman = require('metalman')
const commands = metalman([metalman.action])
```

### metalman.action

The simplest middleware there is. It executes the provided function passed as `action` property on a command config.

```js
const metalman = require('metalman')
const commands = metalman([metalman.action])
const someCommand = commands({action (param) { throw new Error(param) }})

// `someCommand()` returns a callback and therefore `awaiting` it
// will throw an error 'Hello' as we're just proxying it to the error instance
// in the example.
await someCommand('Hello')
```

### instance.object({...methods})

A helper to create multiple methods and return an object

e.g.
```js
const metalman = require('metalman')
const commands = metalman([metalman.action])

// The following declaration will basically return an object
module.exports = commands.object({
  ping: {
    action (cmd) { return 'pong' }
  },
  someAsyncFunction: {
    async action (cmd) { await 'something' }
  }
})

// The returned methods are automatically promisified and callbackified
// Just provide the optional callback as parameter, to execute it as callback
// It will look like something similar like that:
module.exports = {
  ping (cmd, [callback]) { return 'pong' },
  someAsyncFunction (cmd, [callback]) { await 'something' }
}

e.g. if you want to mix in your custom functions, just use a spread operator

// The following declaration will basically return an object
module.exports = {
  someOtherMethod () { return 'Hello World' },
  ...commands.object({
    ping: {
      action (cmd) { return 'pong' }
    },
    someAsyncFunction: {
      async action (cmd) { await 'something' }
    }
  })
}
```

### instance.define('name', config)

Just another helper to declare some commands
e.g.
```js
module.exports = commands
  .define('ping', {action () { return 'pong' }})
  .define('someAsyncFunction', {async action () { await 'something' }})
```

## Example middleware

The action middleware exposed as `require('metalman').action`
```js
function actionMiddleware (config) { return config.action }
```

```js
module.exports = schemaValidation

// The command config directly gets passed to the factory
function schemaValidation (commandConfig) {
  // In case the command doesn't need a middleware, just return a falsy value
  if (!commandConfig.schema) return
  const validator = require('ajv')(commandConfig.schema)

  return function validate (command) {
    // returning `undefined` continues the middleware execution
    if (validator(command)) return
    else throw new Error(JSON.stringify(validator.errors)
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
    action (str) {
      return str
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
