"use strict"

 const HabitatNode_Entity = require('../habitat.node.entity.js')
 const Habitat            = require("../../habitat.js")

module.exports = function(RED) {

  class HabitatNode_HabitatApp extends HabitatNode_Entity
  {
    constructor(_config)
    {
      super(RED, _config)

      var self = this

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

      this.habitat.on('adapterMessage', function(_adapterEntityId, _data){
        self.onAdapterMessage(_adapterEntityId, _data)
      })

      this.created()
    }

    created()
    {
      // the habitat app node should be the first one which is beeing added to the global context
      // that's because the other nodes do need to call some functions on it, so we do add the app
      // reference directly on creation and not on 'ready' as the other nodes will do
      this.addNodeReferenceToHabitatContext()

      // init the habitat application
      this.habitat.init(this.habitatConfig)
    }

    getEntityModuleId()
    {
      return "HABITAT"
    }

    getEntityId()
    {
      return "HABITATAPP"
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

    onAdapterMessage(_adapterEntity, _data)
    {
      console.log('ADAPTER MSG')
      // pass the message to the appropriate adapter node if found, otherwise give some node-red error
      if(!this.habitatContextObject().nodes[_adapterEntity.id])
      {
        this.error('No adapter node for entityId \'' + _adapterEntity.id + '\' found!')
        return
      }
      this.habitatContextObject().nodes[_adapterEntity.id].adapterMessage(_adapterEntity, _data)
    }

  }

  RED.nodes.registerType("habitat-app", HabitatNode_HabitatApp)
}