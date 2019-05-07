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

  }

  RED.nodes.registerType("habitat-adapter-knx", HabitatNode_Adapter_KNX)

}