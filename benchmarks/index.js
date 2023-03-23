'use strict'
const bench = require('nanobench')
const command = require('../')([require('metalman-action')])

const createSyncWithCb = command({
  action (cmd, cb) {
    cb(null, {hello: 'world', command: cmd})
  }
})

bench('createSyncWithCb 100000 times', async function (b) {
  b.start()

  for (let i = 0; i < 100000; i++) {
    await createSyncWithCb({id: '123', data: {}, actor: '123'})
  }

  b.end()
})

const createAsyncWithCallback = command({
  action (cmd, cb) {
    setImmediate(cb, null, {hello: 'world', command: cmd})
  }
})

bench('createAsyncWithCallback 100000 times', async function (b) {
  b.start()

  for (let i = 0; i < 100000; i++) {
    await createAsyncWithCallback({id: '123', data: {}, actor: '123'})
  }

  b.end()
})

const createSync = command({
  action (cmd) {
    return {hello: 'world', command: cmd}
  }
})

bench('createSync 100000 times', async function (b) {
  b.start()

  for (let i = 0; i < 100000; i++) {
    await createSync({id: '123', data: {}, actor: '123'})
  }

  b.end()
})

const createAsync = command({
  async action (cmd) {
    return {hello: 'world', command: cmd}
  }
})

bench('createAsync 100000 times', async function (b) {
  b.start()

  for (let i = 0; i < 100000; i++) {
    await createAsync({id: '123', data: {}, actor: '123'})
  }

  b.end()
})

const createSyncPromise = command({
  action (cmd) {
    return Promise.resolve({hello: 'world', command: cmd})
  }
})

bench('createSyncPromise 100000 times', async function (b) {
  b.start()

  for (let i = 0; i < 100000; i++) {
    await createSyncPromise({id: '123', data: {}, actor: '123'})
  }

  b.end()
})
