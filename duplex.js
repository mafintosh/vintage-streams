var readable = require('./readable')
var writable = require('./writable')

module.exports = readable._duplex(writable)
