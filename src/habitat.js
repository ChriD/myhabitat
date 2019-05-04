/**
 * HABITAT
 *
 *
 * TODOS: - log system does use some ressources even if it is disabled, maybe we find a better solution?
 *        - allow external adapter files to be loaded
 *        - get settings for the built in adapters from extern
 *
 */


"use strict"

const childProcess  = require('child_process')
const HabitatBase   = require('./habitat.base.js')
const Package       = require('../package.json')
const OnChange      = require('on-change')
const Merge         = require('lodash.merge')
const CloneDeep     = require('lodash.clonedeep');


class Habitat extends HabitatBase
{
  constructor()
  {
    super()

    const self = this

    // a configuration object which may be set from external source before call of init()
    this.configuration = {}

    // this is a named array/object which contains all processes for all adapter instances ([ adapterId | process])
    // each adapter is an own seperate nodeJs process to keep the workload off the main habitat process
    // the main habitat process should only maintain the states and distribute messages
    this.adapterEntityProcesses = []

    // these are the entity states object which contains all states of all given things/devices in the habitat system
    // it's an array of objects wherby the ID is a unique identifier of an entity. All changes to properties of any
    // entity have to be made on the 'watched' object 'entityStatesProxied'
    this.entityStates = {}
    this.entityStatesProxied = OnChange(this.entityStates, function(_path, _value, _previousValue){
      self.entityStatesObjectChanged(_path, _value, _previousValue)
    })

  }

  getEntityModuleId()
  {
    return 'CORE'
  }

  getEntityId()
  {
    return 'APP'
  }


  getEntityStates()
  {
    return this.entityStatesProxied
  }


  init(_configuration = {})
  {
    const self = this

    self.configuration = CloneDeep(_configuration)

    self.configuration.comgateway                     = self.configuration.comgateway                     ? self.configuration.comgateway : {}
    self.configuration.comgateway.port                = self.configuration.comgateway.port                ? self.configuration.comgateway.port : 3030
    self.configuration.comgateway.clientPingInterval  = self.configuration.comgateway.clientPingInterval  ? self.configuration.comgateway.clientPingInterval : 30000

    self.configuration.webserver          = self.configuration.webserver          ? self.configuration.webserver : {}
    self.configuration.webserver.enabled  = self.configuration.webserver.enabled  ? self.configuration.webserver.enabled : true
    self.configuration.webserver.port     = self.configuration.webserver.port     ? self.configuration.webserver.port : 8090
    self.configuration.webserver.path     = self.configuration.webserver.path     ? self.configuration.webserver.path :  __dirname + '/web/build/default'

    self.configuration.sysinfo            = self.configuration.sysinfo            ? self.configuration.sysinfo : {}
    self.configuration.sysinfo.enabled    = self.configuration.enabled            ? self.configuration.enabled : true
    self.configuration.sysinfo.interval   = self.configuration.sysinfo.interval   ? self.configuration.sysinfo.interval : 2500

    // habitat comes with a log adapter, this adapter has to be started before logging is possible
    self.registerAdapter('log.js', "LOG", { logLevel : process.env.HABITAT_LOGLEVEL })

    // logs from the habitat instance should be sent to the logger process
    self.on('log', function(_type, _moduleId, _entityId, _log, _object){
      self.sendToLoggerProcess(_type, _moduleId, _entityId, _log, _object)
    })

    self.logInfo(Package.name + ' v' + Package.version)
    self.logDebug('Registered process for adapter entity \'LOG\'')

    // another built in adapter is the communication gateway which allows communication between habitat and
    // other extarnal things. In fact a gui would be a good one to use this
    self.registerAdapter('comGateway.js', "COMGATEWAY", { port : self.configuration.comgateway.port, clientPingInterval: self.configuration.comgateway.clientPingInterval })

    // we do have a webserver for serving the guis
    // TODO: use another path, this one is only for developing
    if(self.configuration.webserver.enabled)
      self.registerAdapter('webserver.js', "WEBSERVER", { port : self.configuration.webserver.port, path: self.configuration.webserver.path })

    // we do add some adapter for system information. The adapter only sends some system infos within its adaper state object
    if(self.configuration.sysinfo.enabled)
      self.registerAdapter('systeminfo.js', "SYSINFO", { interval : self.configuration.sysinfo.interval })
  }


  sendStateUpdateToComGatewayProcess(_path, _value, _previousValue)
  {
    if(this.adapterEntityProcesses['COMGATEWAY'])
        this.adapterEntityProcesses['COMGATEWAY'].send({data : {  action        : "stateUpdate",
                                                                  path          : _path,
                                                                  value         : _value,
                                                                  previousValue : _previousValue } })
  }


  sendToLoggerProcess(_type, _moduleId, _entityId, _log, _object)
  {
    if(this.adapterEntityProcesses['LOG'])
        this.adapterEntityProcesses['LOG'].send({data : { type      : _type,
                                                          moduleId  : _moduleId,
                                                          entityId  : _entityId,
                                                          text      : _log } })
  }


  registerAdapter(_adapterFile, _adapterEntityId, _adapterConfiguration)
  {
    const self = this

    if(self.adapterEntityProcesses[_adapterEntityId])
    {
      self.logError('Adapter process for entity ' + _adapterEntityId + ' already registered!')
      return
    }

    try
    {
      // the '_adapterFile' my be a filename only (then the sytem searches in the internal habitat adapter folder)
      // or a complete path with filename. This is defined by the 'EXT#' prefix and defines an external, non system adapter
      if(_adapterFile.startsWith('EXT#'))
        self.adapterEntityProcesses[_adapterEntityId] = childProcess.fork(_adapterFile, [_adapterEntityId])
      else
        self.adapterEntityProcesses[_adapterEntityId] = childProcess.fork(__dirname + '/processes/habitat.process.adapter.' + _adapterFile, [_adapterEntityId])
      self.adapterEntityProcesses[_adapterEntityId].on('message', function(_message){
        self.onAdapterMessage(_message)
      })

      // after we have set up the adapter process we do send a setup attempt.
      // ATTENTION: we can not be sure that the process was started correctly, we may have to do better in future versions
      self.adapterEntityProcesses[_adapterEntityId].send( { adapter : { action : 'setup', configuration : _adapterConfiguration } } )
      self.logDebug('Registered process for adapter entity \'' + _adapterEntityId + '\'')
    }
    catch(_exception)
    {
      self.logError('Registering process for adapter entity \'' + _adapterEntityId + '\' failed!')
    }
  }


  getAdapterProcess(_adapterEntityId)
  {
    return this.adapterEntityProcesses[_adapterEntityId]
  }


  onAdapterMessage(_message)
  {
    // so here we get messages from all adapters which may be a little bottleneck
    // we have to check if this is going to be a problem.

    // adapters may send a log to the main process
    // this is not the best thing but i found no good method to reference the logger process to the other
    // adapter processes which would make this message distribution obsolete.
    if(_message.adapter && _message.adapter.log)
      this.sendToLoggerProcess( _message.adapter.log.type,
                                _message.adapter.log.moduleId,
                                _message.adapter.log.entityId,
                                _message.adapter.log.text,
                                _message.adapter.log.object)

    // if we have got an adapter state object (this is the one giving info about the adapter viablility)
    // we have to emit this info in an own event. The adapter should send it's state periodically or it
    // can send on every state change, but it would be better to keep the state traffic low!
    if(_message.adapter && _message.adapter.state)
    {
      // every adapter does have an 'adapter state object' which shopuld include infos like connection status aso...
      // we do store this data into the global entity state object too
      this.updateEntityState(_message.adapter.entity.id, _message.adapter.entity, _message.adapter.state, {}, {} )
      this.emit("adapterState", _message.adapter.entity, _message.adapter.state)
    }

    // we may get an entity state from an adapter (for e.g. comGateway)
    if(_message.data && _message.data.entityState)
      this.updateEntityState(_message.data.entityState.entityId, _message.data.entityState.entity, _message.data.entityState.state, _message.data.entityState.originator, _message.data.entityState.specification)

  }


  updateEntityState(_entityId, _entity, _entityState, _originator = {}, _specification = {})
  {
    try
    {
      this.logTrace('State update for entity id: ' + _entityId + ' by ' + (_originator ? _originator.id : 'unknown'))

      // if there is no entry for the entity state we have to create one before we can merge
      if(!this.getEntityStates()[_entityId])
        this.getEntityStates()[_entityId] = { entityId : _entityId, entity : {}, state : {} , originator : {}, specification : {} }

      // we do have information about the entity itself
      Merge(this.getEntityStates()[_entityId].entity, _entity)

      // a state may have some other detailed info (_specification) which describes the type of the state
      Merge(this.getEntityStates()[_entityId].specification, _specification)

      // merge the originator into the state. It may be usefull to have the info who did update the last state
      // this may flood us with some unnecessary messages, but we will see if this will be okay or not
      // we do a merge and not a deep copy because we do not want to trigger the 'on-changed' everytime for the originator
      // the pitfall is, that all originator attribnutes always have to be set
      Merge(this.getEntityStates()[_entityId].originator, _originator)

      // merge given state object into the current one
      Merge(this.getEntityStates()[_entityId].state, _entityState)
    }
    catch(_exception)
    {
      this.logError('State update for entity id: ' + _entityId + ' failed: ' + _exception.toString())
    }
  }


  entityStatesObjectChanged(_path, _value, _previousValue)
  {
    this.logTrace('State changed on path \'' + _path + '\' from \'' + (_previousValue ? _previousValue.toString() : '') + '\' to \'' + (_value ? _value.toString() : '') + '\'')

    // the state change should be sent to the communication gateway, so all clients which
    // are connectedt to the socket will be aware of the status
    this.sendStateUpdateToComGatewayProcess(_path, _value, _previousValue)

    // skip 'originator', 'specification' and 'entity' changes, those we do not want to emit
    // the originator and specification data is beeing set before the state, so whenever a property of the state changes
    // we do have the actual originator and specification up to date
    if(_path.includes('.originator') || _path.includes('.specification') || _path.includes('.entity'))
      return

    // emit the state update so that subscribers will get the info if a state was updated
    // most subscribers will be 'thing' nodes in the node-red ecosystem
    this.emit('entityStateChanged', _path, _value, _previousValue)
  }


  close()
  {
    const self = this
    return new Promise(function(_resolve, _reject) {
      // send close demand to all the adapter process we have started and wait for a little time for them to process the
      // message and to quit gracefully
      const processEntityIds = Object.keys(self.adapterEntityProcesses)
      for(let procIdx=(processEntityIds.length-1); procIdx>=0; procIdx--)
      {
        self.logDebug('Request shutdown on adapter process \'' + processEntityIds[procIdx] +'\'')
        self.adapterEntityProcesses[processEntityIds[procIdx]].send( { adapter : { action : 'close' } })
      }

      setTimeout(function(){
        // after waiting a little bit for the processes to kill themselve, we do send them a kill request
        // that doesnt mean that they will be forced to close, but let's have some trust in our child processes
        for(let procIdx=0; procIdx<processEntityIds.length; procIdx++)
        {
          self.adapterEntityProcesses[processEntityIds[procIdx]].kill()
          self.adapterEntityProcesses[processEntityIds[procIdx]] = null
        }
        _resolve()
      }, 750)
    })
  }
}


module.exports = Habitat