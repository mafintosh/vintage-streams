var tape = require('tape')
var streams = require('../')
var bufferFrom = require('buffer-from')

tape('read data', function (t) {
  var rs = streams.Readable({
    read: function (cb) {
      cb(null, bufferFrom('hello'))
    }
  })

  rs.once('data', function (data) {
    rs.pause()
    t.same(data, bufferFrom('hello'), 'same data')
    t.end()
  })
})

tape('read data and resume', function (t) {
  var rs = streams.Readable({
    read: function (cb) {
      cb(null, bufferFrom('hello'))
    }
  })

  rs.once('data', function (data) {
    rs.pause()
    t.same(data, bufferFrom('hello'), 'same data')
    rs.once('data', function (data) {
      rs.pause()
      t.same(data, bufferFrom('hello'), 'same data')
      t.end()
    })
  })
})

tape('read and destroy', function (t) {
  var rs = streams.Readable({
    read: function (cb) {
      cb(null, bufferFrom('hello'))
    }
  })

  rs.once('data', function (data) {
    rs.destroy()
    t.same(data, bufferFrom('hello'), 'same data')
  })

  rs.on('close', function () {
    t.pass('closed')
    t.end()
  })
})

tape('read and destroy with custom teardown', function (t) {
  var closed = false
  var rs = streams.Readable({
    read: function (cb) {
      cb(null, bufferFrom('hello'))
    },
    destroy: function (cb) {
      t.pass('close is called')
      closed = true
      setTimeout(cb, 100)
    }
  })

  rs.once('data', function (data) {
    rs.destroy()
    t.same(data, bufferFrom('hello'), 'same data')
  })

  rs.on('close', function () {
    t.ok(closed, 'was closed')
    t.end()
  })
})

tape('stream can end', function (t) {
  var data = bufferFrom('hello')
  var rs = streams.Readable({
    read: function (cb) {
      var buf = data
      data = null
      cb(null, buf)
    }
  })

  var once = true

  rs.on('data', function (data) {
    t.ok(once, 'only once')
    t.same(data, bufferFrom('hello'))
    once = false
  })
  rs.on('end', function () {
    t.end()
  })
})

tape('pause pauses end', function (t) {
  var data = bufferFrom('hello')
  var rs = streams.Readable({
    read: function (cb) {
      var buf = data
      data = null
      cb(null, buf)
    }
  })

  var paused = false
  var once = true

  rs.on('data', function (data) {
    t.ok(once, 'only once')
    t.same(data, bufferFrom('hello'))
    once = false
    paused = true
    rs.pause()
    setTimeout(function () {
      paused = false
      rs.resume()
    }, 100)
  })

  rs.on('end', function () {
    t.ok(!paused, 'not paused')
    t.end()
  })
})

tape('push', function (t) {
  var expected = [
    bufferFrom('hello'),
    bufferFrom('how'),
    bufferFrom('are'),
    bufferFrom('you?')
  ]

  var rs = streams.Readable({
    read: function (cb) {
      this.push(bufferFrom('hello'))
      this.push(bufferFrom('how'))
      this.push(bufferFrom('are'))
      this.push(bufferFrom('you?'))
      cb(null, null)
    }
  })

  rs.on('data', function (data) {
    t.same(data, expected.shift(), 'expected data')
  })

  rs.on('end', function () {
    t.same(expected.length, 0, 'no more data')
    t.end()
  })
})
