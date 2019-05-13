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

      this.habitat.on('adapterMessageReceived', function(_adapterEntityId, _data){
        self.onAdapterMessageReceived(_adapterEntityId, _data)
      })

      this.habitat.on('entityStateReceived', function(_adapterEntity, _entity, _entityState, _originator){
        self.onEntityStateReceived(_adapterEntity, _entity, _entityState, _originator)
      })

      this.habitat.on('entityStateChanged', function( _path, _value, _previousValue){
        self.onEntityStateChanged( _path, _value, _previousValue)
      })

      this.created()
    }

    created()
    {
      super.created()

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

    getAdapterProcess(_adapterEntityId)
    {
      return this.habitat.getAdapterProcess(_adapterEntityId)
    }

    close()
    {
      return this.habitat.close()
    }

    getEntityStates()
    {
      return this.habitat.getEntityStates()
    }

    onAdapterMessageReceived(_adapterEntity, _data)
    {
      // pass the message to the appropriate adapter node if found, otherwise give some node-red error
      if(!this.habitatContextObject().nodes[_adapterEntity.id])
      {
        this.error('No adapter node for entityId \'' + _adapterEntity.id + '\' found!')
        return
      }
      this.habitatContextObject().nodes[_adapterEntity.id].adapterMessage(_adapterEntity, _data)
    }

    onEntityStateReceived(_adapterEntity, _entity, _entityState, _originator)
    {
      if(!this.habitatContextObject().nodes[_entity.id])
      {
        this.error('No node for entityId \'' + _adapterEntity.id + '\' found!')
        return
      }
      this.habitatContextObject().nodes[_entity.id].input({ state : _entityState, originator : _originator})
    }

    onEntityStateChanged(_path, _value, _previousValue)
    {
      this.emit('entityStateChanged', _path, _value, _previousValue)
    }

  }

  RED.nodes.registerType("habitat-app", HabitatNode_HabitatApp)
}