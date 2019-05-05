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


    allNodesStarted()
    {
        super.allNodesStarted()
        // TODO: @@@ to adapter base class
        // when all nodes are started we can be sure that the habitat node is ready
        this.habitatAppNode().registerAdapter('knx.js', 'KNX001', { host : "10.0.0.130", port : 3671, forceTunneling : false })
    }


    close(_removed)
    {
      // TODO: @@@ to adapter base class
      // on close we have to wait until the habitat system has done it's shutdown until we
      // can close the the main node
      return this.habitatAppNode().unregisterAdapter('KNX001')
    }

  }

  RED.nodes.registerType("habitat-adapter-knx", HabitatNode_Adapter_KNX)

}