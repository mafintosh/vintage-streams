# vintage-streams

A userland streams implementation that mostly mimicks node core streams but adds error handling and a few other tweaks

```
npm install vintage-streams
```

## Usage

``` js
var streams = require('vintage-streams')

var rs = streams.Readable({
  read: function (cb) {
    this.push(Buffer('hello'))
    this.push(Buffer('world'))
    this.push(null)
    cb()
  }
})

rs.on('data', function (data) {
  console.log(data) // first hello, then data
})

rs.on('end', function () {
  console.log('(no more data)')
})

rs.on('close', function () {
  console.log('(stream is completely closed)')
})
```

## API

### `streams.Readable`

A readable stream represents a source of data that you can read from. An example of this could be a stream the reads the contents of a file.

To make a readable stream use the base class provided by `streams.Readable`.

#### `Readable.push(data)`

Call this method to push data to the stream. Returns `true` if the internal buffer is not full and you should continue pushing data.
If you pass `.push(null)` the stream will end.

Per default all streams pass the data unaltered. If you are writing binary data it might be conveinient to convert all strings to buffers. To do this you can set the `toBuffer` (or `readableToBuffer`) option in the constructor

```
var rs = stream.Readable({
  toBuffer: true // converts strings to buffers when pushing data
})
```

#### `Readable._read(callback)`

The `_read` method is called every time the stream has drained and wants you to push more data to it. You should override this method with your custom reading logic. When you are done reading call the callback. If you call the callback with an error the stream is destroyed. Optionally you can pass a data value as the second argument to the callback to push it. If you pass `null` as the second argument the stream will end.

``` js

var rs = stream.Readable()
var cnt = 0

rs._read = function (cb) {
  cb(null, Buffer('' + (cnt++)))
}

rs.on('data', function (data) {
  console.log(data) // first 0, then 1, ...
})
```

You can also pass the read function as an option in the constructor.

``` js
var rs = stream.Readable({
  read: function (cb) {
    ...
  }
})
```

#### `Readable.destroy([err])`

Destroys the readable stream. No more data will be emitted. If an error is passed an error will be emitted as well.

#### `Readable._destroy(callback)`

Called when the stream is being destroyed. Override this with your custom destroy logic. After the callback is called `close` will be emitted.
This method is always called at the end of the streams lifecycle and you can use this to deallocate any resources you have opened.

``` js
rs._destroy = function (cb) {
  fs.close(fd, cb) // close an open file descriptor fx
}
```

You can also pass the destroy function as an option in the constructor

``` js
var rs = stream.Readable({
  destroy: function (cb) {
    ...
  }
})
```

#### `writableStream = Readable.pipe(writableStream, [callback])`

Pipe the stream to a writable stream. Compatible with node core streams. When the pipe is finished (the writable stream has gracefully ended) the callback is called. If the pipe failed the callback is called with an error. If either the writable stream or the readable stream is destroyed or experiences an error both streams in the pipeline are destroyed.

#### `Readable.pause()`

Pauses the stream. No events will be emitted while the stream is paused unless it is destroyed or resumed. All streams start out paused.

#### `Readable.resume()`

Unpauses the stream.

#### `var data = Readable.read()`

Similar to the core `.read()` method it returns the first data item available in the buffer. If the buffer is empty `null` is returned. Added mostly to be compatible with node core.

#### `Readable.on('readable')`

Emitted when there is data in the buffer available to read.

#### `Readable.on('data', data)`

Emitted when there is data to read. Similar to node code all streams start out paused and adding a data listener will automatically resume it.

#### `Readable.on('end')`

Emitted when the stream has ended gracefully and all data has been read. `end` is not guaranteed to be emitted if the stream is forcefully closed using destroy.

#### `Readable.on('close')`

Emitted when the stream is fully closed. This is always the last event emitted and is guaranteed to be emitted.

#### `Readable.on('error', err)`

Emitted when an error has occurred. Guaranteed to only be emitted once and is followed by the close event.

### `streams.Writable`

A writable stream represents a destination you can write data to. An example of this could be a stream the writes the data written to it to a file.

To make a writable stream use the base class provided by `streams.Writable`.

#### `flushed = Writable.write(data)`

Call this method to write data. Similary to `.push` on readable streams it returns `true` if you continue writing or `false` if you should wait for the stream to drain. When a writable stream has drained it will emit a `drain` event.

#### `Writable._write(data, callback)`

The `_write` method is called every time the writable stream has some data it wants you to write. Call the callback when you are done writing it.

``` js
ws._write = function (data, callback) {
  console.log('someone is writing', data)
  callback()
}
```

You can also pass the write function as an option in the constructor

``` js
var ws = stream.Writable({
  write: function (data, cb) {
    ...
  }
})
```

#### `Writable.destroy([error])`

Destroys the writable stream. No more data will be written. If an error is passed an error will be emitted as well.

#### `Writable._destroy(callback)`

Similar to `_destroy` on a readable stream. Use this to deallocate any resources. Will emit close after the callback has been called.

#### `Writable.cork()`

Pauses the writable stream. No data will be written and no events will emitted while the stream is corked unless it is destroyed.

#### `Writable.cork()`

Unpauses the writable stream.

#### `Writable.on('drain')`

Emitted when the stream has drained and you should start writing more data to it.

#### `Writable.on('finish')`

Emitted when the last data chunk has been written after `.end()` has been called. If the stream has been destroyed this is not guaranteed to be emitted.

#### `Writable.on('error')`

Emitted if the writable stream experiences an error. Will only be emitted once.

#### `Writable.on('close')`

Emitted when the writable stream is fully closed and has been destroyed. Similary to readable streams this is guaranteed to be emitted and is the last event.

### `streams.Duplex`

A duplex stream is a stream that is both readable and writable. An example of this could a be a TCP stream that allows you to read and write from a network connection.

To make a duplex stream use the base class provided by `streams.Duplex`. The duplex stream inherits all methods from both readable and writable streams. See the API for those streams.

### `streams.Transform`

A transform stream is a special duplex stream that transforms the data written to into a readable source. A zip/unzip stream is a good example of this.

To make a transform stream use the base class provided by `streams.Transform`.

#### `Transform._transform(data, callback)

This method is called when there is a piece of data that you should transform.

``` js
ts._transform = function (data, cb) {
  this.push(Buffer(data.toString().toUpperCase())) // uppercase the string
  cb()
}
```

Optionally you can set the transform option in the constructor as well.

``` js
var ts = streams.Transform({
  transform: function (data, cb) {
    ...
  }
})
```

## License

MIT
