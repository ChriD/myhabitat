"use strict"

 const MyHabitatNode  = require('../myhabitat.node.js')
 const Get            = require('lodash.get')

module.exports = function(RED) {

  class MyHabitatNode_State_Get extends MyHabitatNode
  {
    constructor(_config)
    {
      super(RED, _config)
      RED.nodes.createNode(this, _config)
      this.created()
    }

    ready()
    {
      super.ready()
    }


    input(_message)
    {
      super.input(_message)
      this.getState()
    }


    getState()
    {
      const entityState = self.appNode().getEntityStates()[self.config.entityId]
      const value       = Get(entityState, 'state' + this.config.statePath ? ( '.' + this.config.statePath) : '' )
      this.send({ payload: value })
    }

  }

  RED.nodes.registerType("myhabitat-state-get", MyHabitatNode_State_Get)
}