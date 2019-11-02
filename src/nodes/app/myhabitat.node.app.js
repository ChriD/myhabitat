"use strict"

 const MyHabitatNode_Entity = require('../myhabitat.node.entity.js')
 const MyHabitat            = require("../../myhabitat.js")

module.exports = function(RED) {

  class MyHabitatNode_HabitatApp extends MyHabitatNode_Entity
  {
    constructor(_config)
    {
      super(RED, _config)

      var self = this

      RED.nodes.createNode(this, _config)

      // all myHabitat nodes are registereing the 'nodes-started' event, so we raise the warning to 100
      RED.events.setMaxListeners(100)

      // create a configuration object for the myHabitat application
      // the myHabitat application does have dome built in adapters and for that we have to define some values
      this.myHabitatConfig = {}
      this.myHabitatConfig.comgateway = {}
      this.myHabitatConfig.comgateway.port                = parseInt(_config.comgatewayPort)
      this.myHabitatConfig.comgateway.clientPingInterval  = _config.comgatewayPingInterval

      this.myHabitatConfig.webserver = {}
      this.myHabitatConfig.webserver.enabled              = _config.webserverEnabled
      this.myHabitatConfig.webserver.port                 = parseInt(_config.webserverPort)
      this.myHabitatConfig.webserver.path                 = _config.webserverPath

      this.myHabitatConfig.sysinfo = {}
      this.myHabitatConfig.sysinfo.enabled                = _config.sysinfoEnabled
      this.myHabitatConfig.sysinfo.interval               = parseInt(_config.sysinfoInterval)

      this.myHabitatConfig.logger = {}
      this.myHabitatConfig.logger.enabled                 = _config.loggerEnabled
      this.myHabitatConfig.logger.logLevel                = parseInt(_config.loggerLogLevel)

      this.myHabitatConfig.scenes = {}
      this.myHabitatConfig.scenes.storageFile            = _config.scenesStorageFile


      this.myHabitat = new MyHabitat()

      this.myHabitat.on('adapterMessageReceived', function(_adapterEntityId, _data){
        self.onAdapterMessageReceived(_adapterEntityId, _data)
      })

      this.myHabitat.on('entityStateReceived', function(_adapterEntity, _entity, _entityState, _originator){
        self.onEntityStateReceived(_adapterEntity, _entity, _entityState, _originator)
      })

      this.myHabitat.on('entityStateChanged', function( _path, _value, _previousValue){
        self.onEntityStateChanged( _path, _value, _previousValue)
      })

      this.created()
    }

    getEntityModuleId()
    {
      return "MYHABITAT"
    }

    getEntityId()
    {
      return "MYHABITATAPP"
    }

    getDefaultState()
    {
      // TODO: return version?
      return {}
    }

    created()
    {
      super.created()

      // the habitat app node should be the first one which is beeing added to the global context
      // that's because the other nodes do need to call some functions on it, so we do add the app
      // reference directly on creation and not on 'ready' as the other nodes will do
      this.addNodeReferenceToHabitatContext()

       // init the habitat application
       this.myHabitat.init(this.myHabitatConfig)

       // crate a reference of the 'myhabitat' base application
       this.myHabitatContextObject().app = this.myHabitat
    }

    unregisterAdapter(_adapterEntityId)
    {
      return this.myHabitat.unregisterAdapter(_adapterEntityId)
    }


    registerAdapter(_adapterFile, _adapterEntityId, _adapterConfiguration)
    {
      this.myHabitat.registerAdapter(_adapterFile, _adapterEntityId, _adapterConfiguration)
    }

    getAdapterProcess(_adapterEntityId)
    {
      return this.myHabitat.getAdapterProcess(_adapterEntityId)
    }

    close()
    {
      return this.myHabitat.close()
    }

    getEntityStates()
    {
      return this.myHabitat.getEntityStates()
    }

    onAdapterMessageReceived(_adapterEntity, _data)
    {
      // pass the message to the appropriate adapter node if found, otherwise give some node-red error
      if(!this.myHabitatContextObject().nodes[_adapterEntity.id])
      {
        this.error('No adapter node for entityId \'' + _adapterEntity.id + '\' found!')
        return
      }
      this.myHabitatContextObject().nodes[_adapterEntity.id].adapterMessage(_adapterEntity, _data)
    }

    onEntityStateReceived(_adapterEntity, _entity, _entityState, _originator)
    {
      if(!this.myHabitatContextObject().nodes[_entity.id])
      {
        this.error('No node for entityId \'' + _entity.id + '\' found!')
        return
      }
      this.myHabitatContextObject().nodes[_entity.id].input({ state : _entityState, originator : _originator})
    }

    onEntityStateChanged(_path, _value, _previousValue)
    {
      this.emit('entityStateChanged', _path, _value, _previousValue)
    }

  }

  RED.nodes.registerType("myhabitat-app", MyHabitatNode_HabitatApp)
}