const websocket = require('websocket-stream')
const methodman = require('methodman')
const ws = websocket('ws://localhost:8080')
const meth = methodman(ws)
meth.on('commands', remote => {
  remote.echo('foo', function (err, str) {
    if (err) return console.error(err)
    console.log('response', str)
  })
})
