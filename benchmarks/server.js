var http = require('http')

var validate = require('../metalman-schema-validation')
var execute = require('../metalman-command-execution')
var command = require('../')([validate, execute])
var createSomething = command({
  schema: {
    type: 'object',
    properties: {
      id: {type: 'string', maxLength: 36},
      data: {type: 'object'},
      actor: {type: 'string', maxLength: 36}
    }
  },
  action: function (cmd, cb) {
    cb(null, {hello: 'world', command: cmd})
  }
})

var server = http.createServer(function (req, res) {
  createSomething({id: '123', data: {}, actor: '123'}, function (err, data) {
    res.setHeader('Content-Type', 'application/json')
    if (err) return res.end(JSON.stringify(err))
    res.end(JSON.stringify(data))
  })
})

server.listen(8080, function (err) {
  if (err) return console.error(err)
  console.log('Successfully started server on http://localhost:' + 8080)
})
