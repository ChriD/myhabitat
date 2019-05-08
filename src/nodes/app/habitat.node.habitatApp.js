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
      this.habitatConfig.comgateway.port                = parseInt(_config.comgatewayPort)
      this.habitatConfig.comgateway.clientPingInterval  = _config.comgatewayPingInterval

      this.habitatConfig.webserver = {}
      this.habitatConfig.webserver.enabled              = _config.webserverEnabled
      this.habitatConfig.webserver.port                 = parseInt(_config.webserverPort)
      this.habitatConfig.webserver.path                 = _config.webserverPath

      this.habitatConfig.sysinfo = {}
      this.habitatConfig.sysinfo.enabled                = _config.sysinfoEnabled
      this.habitatConfig.sysinfo.interval               = parseInt(_config.sysinfoInterval)

      this.habitatConfig.logger = {}
      this.habitatConfig.logger.enabled                 = _config.loggerEnabled
      this.habitatConfig.logger.logLevel                = parseInt(_config.loggerLogLevel)

      this.habitat = new Habitat()
      this.habitat.init(this.habitatConfig)

      this.created()

      // we have to store this instance to the global context so every habitat child node
      // does have access to the habitat app node
      this.context().global.set(this.getHabitatAppNodeContextId(), this)
    }

    unregisterAdapter(_adapterEntityId)
    {
      return this.habitat.unregisterAdapter(_adapterEntityId)
    }


    registerAdapter(_adapterFile, _adapterEntityId, _adapterConfiguration)
    {
      this.habitat.registerAdapter(_adapterFile, _adapterEntityId, _adapterConfiguration)
    }

    close()
    {
      return this.habitat.close()
    }

  }

  RED.nodes.registerType("habitat-app", HabitatNode_HabitatApp)
}