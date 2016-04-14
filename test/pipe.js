var tape = require('tape')
var stream = require('../')

tape('pipe', function (t) {
  t.plan(7 + 2)

  var datas = [
    Buffer('a'),
    Buffer('b'),
    Buffer('c'),
    Buffer('d'),
    Buffer('e'),
    Buffer('f'),
    Buffer('g')
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
    Buffer('a'),
    Buffer('b'),
    Buffer('c'),
    Buffer('d'),
    Buffer('e'),
    Buffer('f'),
    Buffer('g')
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
    Buffer('a'),
    Buffer('b'),
    Buffer('c'),
    Buffer('d'),
    Buffer('e'),
    Buffer('f'),
    Buffer('g')
  ]

  var expected = [
    Buffer('A'),
    Buffer('B'),
    Buffer('C'),
    Buffer('D'),
    Buffer('E'),
    Buffer('F'),
    Buffer('G')
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
      cb(null, Buffer(data.toString().toUpperCase()))
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
    Buffer('a'),
    Buffer('b'),
    Buffer('c'),
    Buffer('d'),
    Buffer('e'),
    Buffer('f'),
    Buffer('g')
  ]

  var expected = [
    Buffer('A'),
    Buffer('B'),
    Buffer('C'),
    Buffer('D'),
    Buffer('E'),
    Buffer('F'),
    Buffer('G')
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
      cb(null, Buffer(data.toString().toUpperCase()))
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
      cb(null, Buffer('hello'))
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
