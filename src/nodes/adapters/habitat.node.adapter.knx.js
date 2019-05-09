"use strict"

 const HabitatNodeAdapter   = require('../habitat.node.adapter.js')

module.exports = function(RED) {

  class HabitatNode_Adapter_KNX extends HabitatNodeAdapter
  {
    constructor(_config)
    {
      super(RED, _config)

      RED.nodes.createNode(this, _config)

      this.created()
    }


    getEntityModuleId()
    {
      return "KNX"
    }

    getEntityId()
    {
      return this.config.adapterId ? this.config.adapterId : "KNX01"
    }

    getAdapterProcessFile()
    {
      return 'knx.js'
    }

    getAdapterConfiguration()
    {
      return { host : this.config.host , port : this.config.port, forceTunneling : this.config.forceTunneling }
    }

    adapterMessage(_adapterEntity, _data)
    {
      this.log('Received messages: ' + JSON.stringify(_data))
      // TODO: we have retrieved KNX data, so we do emit a event where all KNX nodes are listening on
      // if there is relevant KNX data for the node it will proceed, so in fact every KNX node gets
      // every KNX data we are observing
      // self.output( { event : _event, source : _source, destination : _destination, value : value, valueRaw : _value } )
      this.emit('gaReceived', _data)
      // TODO: we have retrieved a connect state changed event
      //self.output( { connectionState : this.adapterState.connection.connected } )
      this.emit('connectionStateChanged', _data)
      //if(_data.ga)
    }


  }

  RED.nodes.registerType("habitat-adapter-knx", HabitatNode_Adapter_KNX)

}