var events = require('events')
var inherits = require('inherits')
var bufferFrom = require('buffer-from')

module.exports = Writable

function WritableState () {
  this.vintageStream = true
  this.destroyed = false
  this.destroyReason = null
  this.toBuffer = false
  this.halfOpen = true
  this.syncWrite = false
  this.corked = false
  this.drained = true
  this.ended = false
  this.finishEmitted = false
  this.writing = false
  this.buffer = []
  this.source = null
  this.afterPipe = null
  this.afterDestroy = null
  this.afterWrite = null
  this.afterEnd = null
}

function Writable (opts) {
  if (!(this instanceof Writable)) return new Writable(opts)
  if (!opts) opts = {}

  events.EventEmitter.call(this)

  if (opts.write) this._write = opts.write
  if (opts.end) this._end = opts.end
  if (opts.destroy) this._destroy = opts.destroy

  var self = this
  var state = this._writableState = new WritableState()

  state.toBuffer = !opts.toBuffer && !opts.writableToBuffer
  state.afterDestroy = afterDestroy
  state.afterWrite = afterWrite
  state.afterEnd = afterEnd

  function afterWrite (err) {
    if (err) return self.destroy(err)
    state.writing = false

    if (!state.drained) {
      state.drained = true
      if (state.source) state.source.resume()
      self.emit('drain')
    }

    if (!state.writing && !state.syncWrite && state.buffer.length) {
      write(self, state, state.buffer.shift())
    }

    emitFinishMaybe(self, state)
  }

  function afterDestroy (err) {
    if (!err) err = state.destroyReason

    if (state.afterPipe) {
      var cb = state.afterPipe
      state.afterPipe = null
      cb(err || (state.finishEmitted ? null : (state.destroyReason || new Error('Stream closed prematurely'))))
    }

    if (err) self.emit('error', err)
    self.emit('close')
  }

  function afterEnd (err) {
    if (err) return self.destroy(err)
    self.emit('finish')
    if (!state.halfOpen) self.push(null)
    self.destroyMaybe()
  }
}

inherits(Writable, events.EventEmitter)

Writable.prototype.cork = function () {
  var state = this._writableState
  if (state.corked) return
  state.corked = true
  this.emit('cork')
}

Writable.prototype.uncork = function () {
  var state = this._writableState
  if (!state.corked) return
  state.corked = false
  this.emit('uncork')
  if (!state.writing) state.afterWrite(null)
}

Writable.prototype.write = function (data) {
  var state = this._writableState
  return writeMaybe(this, state, (!state.objectMode && typeof data === 'string') ? bufferFrom(data) : data)
}

Writable.prototype.end = function (data) {
  var state = this._writableState
  if (state.ended) return
  if (data) this.write(data)
  state.ended = true
  emitFinishMaybe(this, state)
}

Writable.prototype._write = function (data, cb) {
  // Override me
  cb(null)
}

Writable.prototype._end = function (cb) {
  // Override me
  cb(null)
}

Writable.prototype.destroyMaybe = function () {
  if (this._writableState.finishEmitted) this.destroy()
}

Writable.prototype.destroy =
Writable.prototype.destroyWritable = function (err) {
  var state = this._writableState
  if (state.destroyed) return
  state.destroyed = true

  if (err) state.destroyReason = err
  state.writing = true // set these to stop reading

  if (state.source) {
    var src = state.source
    state.source = null
    if (src.destroy) src.destroy()
  }

  this._destroy(state.afterDestroy)
}

Writable.prototype._destroy = function (cb) {
  // Override me
  cb(null)
}

function writeMaybe (self, state, data) {
  if (state.destroyed || state.ended) return false

  if (!state.writing && !state.buffer.length && !state.corked) {
    write(self, state, data)
    return true
  }

  var length = state.buffer.push(data)
  if (state.drained) state.drained = length < 16
  return state.drained
}

function write (self, state, data) {
  while (!state.destroyed && !state.writing) {
    state.writing = true
    state.syncWrite = true
    self._write(data, state.afterWrite)
    state.syncWrite = false
    if (state.writing) return
    if (!state.buffer.length) break
    data = state.buffer
  }

  emitFinishMaybe(self, state)
}

function emitFinishMaybe (self, state) {
  if (!state.ended || state.buffer.length || state.finishEmitted || state.destroyed || state.corked || state.writing) return
  state.finishEmitted = true
  state.writing = true
  self._end(state.afterEnd)
}
