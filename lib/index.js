'use strict'

var Client = require('./client')
var defaults = require('./defaults')
var Connection = require('./connection')
var Pool = require('pg-pool')
const { DatabaseError } = require('pg-protocol')

const poolFactory = (Client) => {
  return class BoundPool extends Pool {
    constructor(options) {
      super(options, Client)
    }
  }
}

module.exports = {
  defaults: defaults,
  _pools: [],
  Connection: Connection,
  types: require('pg-types'),
  DatabaseError: DatabaseError,
}

if (typeof process.env.NODE_PG_FORCE_NATIVE !== 'undefined') {
  var nativeClient = require('./native')
  module.exports.Client = nativeClient
  module.exports.Query = nativeClient.Query
  module.exports.Pool = poolFactory(nativeClient)
} else {
  module.exports.Client = Client
  module.exports.Query = Client.Query
  module.exports.Pool = poolFactory(Client)

  // lazy require native module...the native module may not have installed
  Object.defineProperty(module.exports, 'native', {
    configurable: true,
    enumerable: false,
    get() {
      var native = null
      try {
        native = new PG(require('./native'))
      } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') {
          throw err
        }
      }

      // overwrite module.exports.native so that getter is never called again
      Object.defineProperty(module.exports, 'native', {
        value: native,
      })

      return native
    },
  })
}
