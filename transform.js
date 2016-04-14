var duplex = require('./duplex')
var inherits = require('inherits')

module.exports = Transform

function TransformState () {
  this.afterTransform = null
  this.writeData = null
  this.writeCallback = null
  this.readCallback = null
}

function Transform (opts) {
  if (!(this instanceof Transform)) return new Transform(opts)
  if (!opts) opts = {}

  duplex.call(this)
  this._writableState.halfOpen = false

  if (opts.transform) this._transform = opts.transform
  if (opts.end) this._end = opts.end
  if (opts.destroy) this._destroy = opts.destroy

  var self = this
  var state = this._transformState = new TransformState()

  state.afterTransform = afterTransform

  function afterTransform (err, data) {
    if (err) return self.destroy(err)
    if (data) self.push(data)

    var writeCallback = state.writeCallback
    var readCallback = state.readCallback

    state.writeCallback = null
    state.readCallback = null

    writeCallback()
    readCallback()
  }
}

inherits(Transform, duplex)

Transform.prototype._transform = function (data, cb) {
  cb(null, data)
}

Transform.prototype._write = function (data, cb) {
  var state = this._transformState
  state.writeData = data
  state.writeCallback = cb
  transform(this, state)
}

Transform.prototype._read = function (cb) {
  var state = this._transformState
  state.readCallback = cb
  transform(this, state)
}

function transform (self, state) {
  if (!state.writeData || !state.readCallback || !state.writeCallback) return
  var data = state.writeData
  state.writeData = null
  self._transform(data, state.afterTransform)
}
