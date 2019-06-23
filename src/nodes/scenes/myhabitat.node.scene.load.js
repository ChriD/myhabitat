"use strict"

 const MyHabitatNode  = require('../myhabitat.node.js')
 const Get            = require('lodash.get')

module.exports = function(RED) {

  class MyHabitatNode_Scene_Load extends MyHabitatNode
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
      const payload = _message.payload

      switch(typeof payload)
      {
        case "string":
          if(payload)
            this.appNode().myHabitat.loadScene(payload)
          break
        default:
          if(this.config.sceneId)
            this.appNode().myHabitat.loadScene(this.config.sceneId)
          break
      }

    }


  }

  RED.nodes.registerType("myhabitat-scene-load", MyHabitatNode_Scene_Load)
}