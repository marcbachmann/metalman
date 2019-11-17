const bench = require('nanobench')
const command = require('../')([require('metalman-action')])

const createWithCb = command({
  action (cmd, cb) {
    cb(null, {hello: 'world', command: cmd})
  }
})

bench('createWithCb 1000000 times', async function (b) {
  b.start()

  for (let i = 0; i < 1000000; i++) {
    await createWithCb({id: '123', data: {}, actor: '123'})
  }

  b.end()
})

const createSync = command({
  action (cmd) {
    return {hello: 'world', command: cmd}
  }
})

bench('createSync 1000000 times', async function (b) {
  b.start()

  for (let i = 0; i < 1000000; i++) {
    await createSync({id: '123', data: {}, actor: '123'})
  }

  b.end()
})

const createAsync = command({
  action (cmd) {
    return {hello: 'world', command: cmd}
  }
})

bench('createAsync 1000000 times', async function (b) {
  b.start()

  for (let i = 0; i < 1000000; i++) {
    await createAsync({id: '123', data: {}, actor: '123'})
  }

  b.end()
})
