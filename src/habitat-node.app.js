// https://github.com/node-red/node-red/wiki/API-Reference
// https://nodered.org/docs/creating-nodes/status


module.exports = function(RED) {
    "use strict"

    const Path          = require('path')
    const Habitat_Node  = require('./habitat-node.js')
    const Habitat_App   = require('./habitat-app.js')

    class Habitat_Node_App extends Habitat_Node
    {
      constructor(_config)
      {
        super(RED, _config)
        RED.nodes.createNode(this, _config);
        var node = this

        node.logInfo("Starting habitat")

        // create the habitat app
        node.habitat = new Habitat_App()

        // the habitat instance does have a logger which logs we do redirect to the node-red log output
        node.habitat.logger.on("log", function(_log){
          let log = "[" + _log.moduleId + "]" + (_log.sourceId ? ("(" + _log.sourceId + ") ") : " ")  + _log.log
          if(_log.type <= 10)
            node.error(log)
          else if(_log.type <= 20)
            node.warning(log)
          else
            node.log(log)
        })

        // update some default path for several modules
        node.habitat.storage.defaultPath    = Path.join(RED.settings.userDir, "habitat/storage") + "/"
        node.habitat.guiServer.defaultPath  = Path.join(RED.settings.userDir, "habitat/webclients") + "/"

        node.habitat.init()

        node.on('input', function(){ node.onInput() })
        node.on('close', function(){ node.onClose() })

        // we have to store this instance to the global context so every habitat child node
        // does have access to the habitat app
        node.context().global.set(node.getHabitatGlobalContextId(), node)
      }


      close()
      {
        this.log("Shutting down habitat")
        this.habitat.close()
      }


      onInput()
      {
        // TODO: control message.. send to habitat app!
      }


      nodesStarted()
      {
        super.nodesStarted()
      }

    }


    RED.nodes.registerType("habitat-app", Habitat_Node_App);
}
