const validateSchema = require('metalman/metalman-schema-validation')
const executeCommand = require('metalman/metalman-command-execution')
const methodman = require('methodman')
const metalman = require('metalman')
const websocket = require('websocket-stream')

const command = metalman([validateSchema, executeCommand])
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
