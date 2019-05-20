/**
 * NODE STATE OBSERVER
 *
 *
 * TODOS: - add conditionals (if state = ...)
 *
 */


"use strict"

 const HabitatNode    = require('../myhabitat.node.js')
 const Habitat        = require("../../myhabitat.js")
 const Get            = require('lodash.get')

module.exports = function(RED) {

  class HabitatNode_State_Observer extends HabitatNode
  {
    constructor(_config)
    {
      super(RED, _config)
      RED.nodes.createNode(this, _config)
    }

    ready()
    {
      const self = this

      super.ready()

      // attach to the habitat state emitter
      self.habitatAppNode().on('entityStateChanged', function(_path, _value, _previousValue){
        self.stateChanged(_path, _value, _previousValue)
      })

      // be sure to output the initial state on node init. It ma be the case that the state for the entity
      // is not set already, so then we would not find a state object. But that is okay because in this
      // case the stateChanged' will trigger
      if(self.config.initialSend)
      {
        const entityState = self.habitatAppNode().getEntityStates()[self.config.entityId]
        if(entityState)
          self.stateChanged(this.config.entityId + '.state.' + self.config.statePath , Get(entityState.state, self.config.statePath) , null)
        //else
        //  self.error('No state object for entity \'' + self.config.entityId +'\' found')
      }

    }

    stateChanged(_path, _value, _previousValue)
    {
      if(_path === this.config.entityId + '.state.' + this.config.statePath)
        this.send({ payload: _value })
    }

  }

  RED.nodes.registerType("myhabitat-state-observer", HabitatNode_State_Observer)
}