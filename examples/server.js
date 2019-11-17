const Methodman = require('methodman')
const websocket = require('websocket-stream')

const schema = require('metalman-schema')
const Metalman = require('metalman')
const metalman = Metalman([schema, Metalman.action])

const commands = metalman.object({
  echo: {
    schema: {type: 'string'},
    action (str, callback) {
      callback(null, str)
    }
  }
})

function onWebsocketStream (stream) {
  Methodman(stream).commands(commands)
}

const http = require('http')
const server = http.createServer(function (req, res) { res.end() })
websocket.createServer({server}, onWebsocketStream)

const port = process.env.PORT || 0
server.listen(port, function (err) {
  if (err) return console.error(err)
  console.log('Listening on http://localhost:%s', server.address().port)
})
