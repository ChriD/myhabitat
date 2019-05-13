/**
 * NODE STATE OBSERVER
 *
 *
 * TODOS: - add conditionals (if state = ...)
 *
 */


"use strict"

 const HabitatNode    = require('../habitat.node.js')
 const Habitat        = require("../../habitat.js")

module.exports = function(RED) {

  class HabitatNode_State_Observer extends HabitatNode
  {
    constructor(_config)
    {
      super(RED, _config)

      var self = this

      RED.nodes.createNode(this, _config)

      this.created()
    }

    ready()
    {
      const self = this

      super.ready()

      // attach to the habitat state emitter
      this.habitatAppNode().on('entityStateChanged', function(_path, _value, _previousValue){
        self.stateChanged(_path, _value, _previousValue)
      })
    }

    stateChanged(_path, _value, _previousValue)
    {
      const self = this
      if(_path === this.config.entityId + '.state.' + this.config.statePath)
        self.send({ payload: _value })
    }

  }

  RED.nodes.registerType("habitat-state-observer", HabitatNode_State_Observer)
}