// https://github.com/node-red/node-red/wiki/API-Reference
// https://nodered.org/docs/creating-nodes/status


/**
 * This node is an adapter for the habitat system which provides writable access to the ARTNET (DMX) universe
 * it uses the artnet library from https://github.com/hobbyquaker/artnet
 */
module.exports = function(RED) {

  "use strict"

  const Habitat_Node_Adapter  = require('./habitat-node.adapter.js')

  class Habitat_Node_Adapter_Artnet extends Habitat_Node_Adapter
  {
    constructor(_config)
    {
      super(RED, _config)

      var self = this
      self.options = {
        host: '10.0.0.125',
        port: '6454',
        refresh: 4000,
        universe: 0
      }

      self.artnet = require('artnet')(self.options)

      // TODO:  we do not have good infos from the underlaying artnet library if connection is ok or not
      //        so we assume that connection is ok and set it on error if there is a socket error
      self.status({fill:"green",shape:"dot",text:"connected"})
      self.isConnected = true

      // get the errors for the socket connection
      // TODO:  we maybe have to extend the lib for better reliablility because if the connection is lost
      //        it will never reconnect until node-red is restarted or node is redeployed
      self.artnet.on('error', function(_error){
        self.isConnected = false
        self.status({fill:"red",shape:"ring",text:"disconnected"})
        self.logError("Connection error: " + _error.toString(), _error)
      })

      RED.nodes.createNode(self, _config)

      // we have to call the created event for some stuff which will be done in the base class
      self.created()
    }

    /**
     * should return a unique persistant id of the adapter instance
     * @return {string}
     */
    getAdapterId()
    {
      var adapterId = super.getAdapterId()
      if(adapterId)
        return adapterId
      return "ARTNET_01"
    }

    /**
     * should return the type of the adapter
     * this is if there are more instances of one adapter so that we can range the popup on the Adapter selection of the 'things'
     *  @return {string}
     */
    getAdapterType()
    {
      return "ARTNET"
    }

    /**
     * will be called when node is closing
     */
    close()
    {
      this.artnet.close()
      super.close()
    }

    /**
     * send values to the dmx universe
     * @param {integer} _channel starting channel wheer the -values are going to be set
     * @param {integer[]} _values values to be set from starting channel
     */
    sendToArtnet(_channel, _values)
    {
        this.artnet.set(this.options.universe, this.toInt(_channel), _values)
        this.send({ 'universe' : this.options.universe,
                    'channel' : _channel,
                    'values' : _values,
       })
    }

  }

  RED.nodes.registerType("habitat-adapter-artnet", Habitat_Node_Adapter_Artnet)
}
