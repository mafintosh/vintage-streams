var tape = require('tape')
var streams = require('../')

tape('write', function (t) {
  var ws = streams.Writable({
    write: function (data, cb) {
      t.same(data, Buffer('hello'), 'wrote hello')
      t.end()
      cb()
    }
  })

  ws.write(Buffer('hello'))
})

tape('write multiple times', function (t) {
  t.plan(5)

  var ws = streams.Writable({
    write: function (data, cb) {
      t.same(data, Buffer('hello'), 'wrote hello')
      cb()
    }
  })

  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
})

tape('write one at a time', function (t) {
  t.plan(10)

  var writing = false
  var ws = streams.Writable({
    write: function (data, cb) {
      t.ok(!writing, 'not writing')
      writing = true
      t.same(data, Buffer('hello'), 'wrote hello')
      setTimeout(function () {
        writing = false
        cb()
      }, 50)
    }
  })

  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
})

tape('emits finish', function (t) {
  var writing = false
  var ws = streams.Writable({
    write: function (data, cb) {
      t.ok(!writing, 'not writing')
      writing = true
      t.same(data, Buffer('hello'), 'wrote hello')
      setTimeout(function () {
        writing = false
        cb()
      }, 50)
    }
  })

  ws.on('finish', function () {
    t.ok(!writing, 'not writing')
    t.end()
  })

  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
  ws.end()
})

tape('emits close after finish', function (t) {
  var finished = false
  var ws = streams.Writable({
    write: function (data, cb) {
      t.same(data, Buffer('hello'), 'wrote hello')
      cb()
    }
  })

  ws.on('finish', function () {
    t.ok(!finished, 'not finished')
    finished = true
  })

  ws.on('close', function () {
    t.ok(finished, 'was finished')
    t.end()
  })

  ws.write(Buffer('hello'))
  ws.write(Buffer('hello'))
  ws.end()
})
