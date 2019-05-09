"use strict"

const HabitatNode_Thing_KNX   = require('./habitat.node.thing.knx.js')


module.exports = function(RED) {

  class HabitatNode_Thing_KNX_Light extends HabitatNode_Thing_KNX
  {
    constructor(_config)
    {
      super(RED, _config)

      RED.nodes.createNode(this, _config)

      this.created()
    }

    input()
    {
      // Input can come from socket or from node gui itself!?!?
    }


    ready()
    {
      super.ready()
      // TODO: register the gas to watch (Feeback gas)
    }

    /*
    stateChanged()
    {
      // TODO: if state of entity (thing) has chaned we have to do something
    }
    */


  }


  RED.nodes.registerType('habitat-thing-knx-light', HabitatNode_Thing_KNX_Light)

}