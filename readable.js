var events = require('events')
var inherits = require('inherits')

module.exports = duplex(events.EventEmitter, false)

function duplex (From, isWritable) {
  function ReadableState () {
    this.toBuffer = false
    this.vintageStream = true // feature flag
    this.syncRead = false
    this.destroyed = false
    this.destroyReason = null
    this.reading = true
    this.paused = true
    this.ended = false
    this.endEmitted = false
    this.buffer = []
    this.destination = null
    this.afterRead = null
    this.afterDestroy = null
    this.afterPipe = null
  }

  function Readable (opts) {
    if (!(this instanceof Readable)) return new Readable(opts)
    if (!opts) opts = {}

    if (isWritable) From.call(this, opts)
    else From.call(this)

    if (opts.read) this._read = opts.read
    if (opts.destroy) this._destroy = opts.destroy

    var self = this
    var state = this._readableState = new ReadableState()

    state.toBuffer = !opts.toBuffer && !opts.readableToBuffer
    state.afterRead = afterRead
    state.afterDestroy = afterDestroy

    this.on('newListener', newListener)
    process.nextTick(afterRead)

    function afterRead (err, data) {
      if (err) return self.destroy(err)
      if (data || data === null) self.push(data)
      state.reading = false
      if (!state.syncRead) read(self, state)
    }

    function afterDestroy (err) {
      if (!err) err = state.destroyReason
      if (err) self.emit('error', err)
      self.emit('close')
    }
  }

  inherits(Readable, From)

  Readable._duplex = function (Writable) {
    return duplex(Writable, true)
  }

  Readable.prototype.pipe = function (dest, cb) {
    var state = this._readableState
    var wstate = dest._writableState

    if (state.destination) throw new Error('Can only pipe a stream once')
    state.destination = dest

    if (!wstate || !wstate.vintageStream) {
      state.afterPipe = cb || null
      fallbackPipe(this, state, dest)
    } else {
      wstate.afterPipe = cb || null
      if (wstate.source) throw new Error('Can only pipe a single stream to a writable one')
      wstate.source = this
      this.on('error', noop)
      dest.on('error', noop)
    }

    this.resume()
    return dest
  }

  Readable.prototype.push = function (data) {
    var state = this._readableState
    if (state.destroyed) return false
    if (data === null) return end(this, state)
    return push(this, state, !state.toBuffer && typeof data === 'string' ? Buffer(data) : data)
  }

  Readable.prototype.pause = function () {
    var state = this._readableState
    if (state.destroyed || state.paused) return
    state.paused = true
    this.emit('pause')
  }

  Readable.prototype.resume = function () {
    var state = this._readableState
    if (state.destroyed || !state.paused) return
    state.paused = false
    this.emit('resume')
    while (!state.paused && state.buffer.length) ondata(this, state, state.buffer.shift())
    emitEndMaybe(this, state)
    read(this, state)
  }

  Readable.prototype.destroyMaybe = function () {
    if (isWritable && !this._writableState.finishEmitted) return
    if (!this._readableState.endEmitted) return
    this.destroy()
  }

  Readable.prototype.destroy = function (err) {
    var state = this._readableState
    if (state.destroyed) return
    state.destroyed = true

    if (err) state.destroyReason = err
    state.reading = true // set these to stop reading
    state.paused = true
    state.endEmitted = true

    if (isWritable) this.destroyWritable()

    if (state.destination) {
      var dest = state.destination
      state.destination = null
      if (dest.destroy) dest.destroy()
    }

    this._destroy(state.afterDestroy)
  }

  Readable.prototype.read = function () {
    var state = this._readableState
    var data = state.buffer.shift() || null
    if (data) this.emit('data', data)
    read(this, state)
    return data
  }

  Readable.prototype._destroy = function (cb) {
    // Override me
    cb(null)
  }

  Readable.prototype._read = function (cb) {
    // Override me
    cb(null, null)
  }

  function read (self, state) {
    while (!state.destroyed && !state.ended && !state.reading && state.buffer.length < 16) {
      state.reading = true
      state.syncRead = true
      self._read(state.afterRead)
      state.syncRead = false
    }
  }

  function end (self, state) {
    state.ended = true
    emitEndMaybe(self, state)
    return false
  }

  function emitEndMaybe (self, state) {
    if (!state.paused && state.ended && !state.buffer.length && !state.endEmitted) {
      state.endEmitted = true
      state.paused = true
      self.emit('end')

      if (state.destination) {
        var dest = state.destination
        state.destination = null
        dest.end()
      }

      self.destroyMaybe()
    }
  }

  function ondata (self, state, data) {
    self.emit('data', data)
    if (state.destination) {
      if (!state.destination.write(data)) self.pause()
    }
  }

  function push (self, state, data) {
    if (!state.paused && !state.buffer.length) {
      ondata(self, state, data)
      return true
    }

    var length = state.buffer.push(data)
    if (length === 1) self.emit('readable')
    return length < 16
  }

  function newListener (name) {
    if (name === 'data') this.resume()
  }

  function fallbackPipe (self, state, dest) {
    dest.on('finish', onclose)
    dest.on('close', onclose)
    dest.on('error', done)
    dest.on('drain', ondrain)

    function ondrain () {
      self.resume()
    }

    function done (err) {
      var cb = state.afterPipe
      state.afterPipe = null
      state.destination = null
      if (!state.ended) self.destroy()
      if (cb) cb(err)
    }

    function onclose () {
      if (!state.ended) done(state.destroyReason || new Error('Stream closed prematurely'))
      else done(null)
    }
  }

  function noop () {}

  return Readable
}
