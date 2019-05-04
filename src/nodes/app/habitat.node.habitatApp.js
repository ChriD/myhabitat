"use strict"

 const HabitatNode   = require('../habitat.node.js')
 const Habitat       = require("../../habitat.js")

module.exports = function(RED) {

  class HabitatNode_HabitatApp extends HabitatNode
  {
    constructor(_config)
    {
      super(RED, _config)

      RED.nodes.createNode(this, _config)

      // create a configuration object for the habitat application
      // the habitat application foes have dome built in adapters and for that we have to define some values
      this.habitatConfig = {}
      this.habitatConfig.comgateway = {}
      this.habitatConfig.comgateway.port                = _config.comgatewayPort
      this.habitatConfig.comgateway.clientPingInterval  = _config.comgatewayPingInterval

      this.habitatConfig.webserver = {}
      this.habitatConfig.webserver.enabled              = _config.webserverEnabled
      this.habitatConfig.webserver.port                 = _config.webserverPort
      this.habitatConfig.webserver.path                 = _config.webserverPath

      this.habitatConfig.sysinfo = {}
      this.habitatConfig.sysinfo.enabled                = _config.sysinfoEnabled
      this.habitatConfig.sysinfo.interval               = _config.sysinfoInterval

      this.habitat = new Habitat()
      this.habitat.init(this.habitatConfig)

      this.created()
    }


    close(_removed, _done)
    {
      this.habitat.close()
      super.close(_removed, _done)
    }

  }

  RED.nodes.registerType("habitat-app", HabitatNode_HabitatApp)

}



// https://github.com/node-red/node-red/wiki/API-Reference
// https://nodered.org/docs/creating-nodes/status


/*
module.exports = function(RED) {
  "use strict"


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


    getNodeId()
    {
      return "HABITAT APP"
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
*/