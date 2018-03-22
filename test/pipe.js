var tape = require('tape')
var stream = require('../')
var bufferFrom = require('buffer-from')

tape('pipe', function (t) {
  t.plan(7 + 2)

  var datas = [
    bufferFrom('a'),
    bufferFrom('b'),
    bufferFrom('c'),
    bufferFrom('d'),
    bufferFrom('e'),
    bufferFrom('f'),
    bufferFrom('g')
  ]

  var i = 0
  var j = 0

  var rs = stream.Readable({
    read: function (cb) {
      cb(null, datas[i++] || null)
    }
  })

  var ws = stream.Writable({
    write: function (data, cb) {
      t.same(data, datas[j++], 'getting expected data')
      cb()
    }
  })

  rs.on('end', function () {
    t.pass('readable ends')
  })

  ws.on('finish', function () {
    t.pass('writable finishes')
  })

  rs.pipe(ws)
})

tape('pipe with callback', function (t) {
  var datas = [
    bufferFrom('a'),
    bufferFrom('b'),
    bufferFrom('c'),
    bufferFrom('d'),
    bufferFrom('e'),
    bufferFrom('f'),
    bufferFrom('g')
  ]

  var i = 0
  var j = 0

  var rs = stream.Readable({
    read: function (cb) {
      cb(null, datas[i++] || null)
    }
  })

  var ws = stream.Writable({
    write: function (data, cb) {
      t.same(data, datas[j++], 'getting expected data')
      cb()
    }
  })

  rs.pipe(ws, function (err) {
    t.ok(!err, 'no error')
    t.end()
  })
})

tape('pipe with transform', function (t) {
  t.plan(7)

  var datas = [
    bufferFrom('a'),
    bufferFrom('b'),
    bufferFrom('c'),
    bufferFrom('d'),
    bufferFrom('e'),
    bufferFrom('f'),
    bufferFrom('g')
  ]

  var expected = [
    bufferFrom('A'),
    bufferFrom('B'),
    bufferFrom('C'),
    bufferFrom('D'),
    bufferFrom('E'),
    bufferFrom('F'),
    bufferFrom('G')
  ]

  var i = 0
  var j = 0

  var rs = stream.Readable({
    read: function (cb) {
      cb(null, datas[i++] || null)
    }
  })

  var ts = stream.Transform({
    transform: function (data, cb) {
      cb(null, bufferFrom(data.toString().toUpperCase()))
    }
  })

  var ws = stream.Writable({
    write: function (data, cb) {
      t.same(data, expected[j++], 'getting expected data')
      cb()
    }
  })

  rs.pipe(ts).pipe(ws)
})

tape('pipe with transform and callback', function (t) {
  var datas = [
    bufferFrom('a'),
    bufferFrom('b'),
    bufferFrom('c'),
    bufferFrom('d'),
    bufferFrom('e'),
    bufferFrom('f'),
    bufferFrom('g')
  ]

  var expected = [
    bufferFrom('A'),
    bufferFrom('B'),
    bufferFrom('C'),
    bufferFrom('D'),
    bufferFrom('E'),
    bufferFrom('F'),
    bufferFrom('G')
  ]

  var i = 0
  var j = 0

  var rs = stream.Readable({
    read: function (cb) {
      cb(null, datas[i++] || null)
    }
  })

  var ts = stream.Transform({
    transform: function (data, cb) {
      cb(null, bufferFrom(data.toString().toUpperCase()))
    }
  })

  var ws = stream.Writable({
    write: function (data, cb) {
      t.same(data, expected[j++], 'getting expected data')
      cb()
    }
  })

  rs.pipe(ts).pipe(ws, function (err) {
    t.ok(!err, 'no error')
    t.end()
  })
})

tape('pipe with callback and destroy rs', function (t) {
  var rs = stream.Readable({
    read: function (cb) {
      this.destroy()
    }
  })

  var ws = stream.Writable()

  rs.pipe(ws, function (err) {
    t.ok(err, 'had error')
    t.end()
  })
})

tape('pipe with callback and destroy ws', function (t) {
  var rs = stream.Readable({
    read: function (cb) {
      cb(null, bufferFrom('hello'))
    }
  })

  var ws = stream.Writable({
    write: function (data, cb) {
      this.destroy()
    }
  })

  rs.pipe(ws, function (err) {
    t.ok(err, 'had error')
    t.end()
  })
})
