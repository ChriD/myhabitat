/**
 * NODE STATE OBSERVER
 *
 *
 * TODOS: - add conditionals (if state = ...)
 *
 */

"use strict"

 const MyHabitatNode  = require('../myhabitat.node.js')
 const Get            = require('lodash.get')

module.exports = function(RED) {

  class MyHabitatNode_State_Observer extends MyHabitatNode
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
      self.appNode().on('entityStateChanged', function(_path, _value, _previousValue){
        self.stateChanged(_path, _value, _previousValue)
      })

      // be sure to output the initial state on node init. It ma be the case that the state for the entity
      // is not set already, so then we would not find a state object. But that is okay because in this
      // case the stateChanged' will trigger
      if(self.config.initialSend)
      {
        const entityState = self.appNode().getEntityStates()[self.config.entityId]
        if(entityState)
          self.stateChanged(this.config.entityId + '.state.' + self.config.statePath , Get(entityState.state, self.config.statePath) , null)
      }

    }

    stateChanged(_path, _value, _previousValue)
    {
      if(_path === this.config.entityId + '.state.' + this.config.statePath)
        this.send({ payload: _value })
    }

  }

  RED.nodes.registerType("myhabitat-state-observer", MyHabitatNode_State_Observer)
}