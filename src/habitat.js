/**
 * HABITAT
 *
 *
 * TODOS: - log system does use some ressources even if it is disabled, maybe we find a better solution?
 *        - allow external adapter files to be loaded
 *        - SYSINFO adapter crashes when USB is attached (at least when my handy is attached)
 *        - add external adapter + nodes (Raumfeld)
 *        - logging to files with a existing logger (watson?)
 *        - admin panel with state viewer and logger
 *        - node helps and descriptions!
 *        - github wiki
 *
 */


"use strict"

const childProcess  = require('child_process')
const HabitatBase   = require('./habitat.base.js')
const Package       = require('../package.json')
const OnChange      = require('on-change')
const Merge         = require('lodash.merge')
const CloneDeep     = require('lodash.clonedeep');
const LogLevel      = require("./globals/habitat.global.log.js").LogLevel


class Habitat extends HabitatBase
{
  constructor()
  {
    super()

    const self = this

    // a configuration object which may be set from external source before call of init()
    this.configuration = {}

    // a object which does contain some informational statistics like average message throughput, currently spawend processes, aso...
    // this info state will be copied periodically to the entity state object
    // thise states are not directly set to the state object to prevent flooding of state changes
    this.statistics = { counters :  { processes:  { active : 0 },
                                      messages:   { adapters : { in : 0, inPrev : 0, out : 0, outPrev : 0 } , overallCount : [] },
                                      states:     { updates : 0 }
                                    }
                      }
    this.statisticsCalcIntervalId = setInterval(function(){
      self.calcStatistics()
    }, 1000)

    // this is a named array/object which contains all processes for all adapter instances ([ adapterId | { process, configuration }])
    // each adapter is an own seperate nodeJs process to keep the workload off the main habitat process
    // the main habitat process should only maintain the states and distribute messages
    this.adapterEntityProcesses =  {}

    // this object contains the entoity ids of the processes and a marker if the process has send an alive ping
    // the alive ping is beeing sent by every adapter once a second, the wachtdog intervall does a checlk every 3 seconds if
    // there is a process which dit not respond. if its the case the watchdog will restart the process (kill+create)
    this.adapterEntityProcessWatchdogList       = {}
    this.adapterEntityProcessWatchdogIntervalId = 0

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

    // be sure all configuration values are set to a standard value if not given on init
    self.updateConfiguration(_configuration)

    // habitat comes with a log adapter, this adapter has to be started before logging is possible
    if(self.configuration.logger.enabled)
      self.registerAdapter('log.js', "LOG", { logLevel : self.configuration.logger.logLevel })

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
    if(self.configuration.webserver.enabled)
      self.registerAdapter('webserver.js', "WEBSERVER", { port : self.configuration.webserver.port, path: self.configuration.webserver.path })

    // we do add some adapter for system information. The adapter only sends some system infos within its adaper state object
    if(self.configuration.sysinfo.enabled)
      self.registerAdapter('systeminfo.js', "SYSINFO", { interval : self.configuration.sysinfo.interval })

    // start the watchdog intervall for probing our adapter processes
    if(self.configuration.adapterProcessWatchdog.enabled)
    {
      self.adapterEntityProcessWatchdogIntervalId = setInterval(function(){
        self.adapterEntityProcessWatchdog()
      }, self.configuration.adapterProcessWatchdog.interval)
    }

  }


  adapterEntityProcessWatchdog()
  {
    const self = this
    const processEntityIds = Object.keys(this.adapterEntityProcessWatchdogList)
    const processEntityIdsRespawn = []

    // TODO: should i used the connected & killed info on the process object instead the ping loop?
    //
    for(let idx=(processEntityIds.length-1); idx>=0; idx--)
    {
      // check if the process has updated the state in the watchdog list.
      // if this is not the case, we have to reboot the process, fot this we do store the entity id into a list
      if(this.adapterEntityProcessWatchdogList[processEntityIds[idx]] === false)
      {
        this.logError('Adapter entity process ' + processEntityIds[idx] + ' seems to be crashed!')
        processEntityIdsRespawn.push(processEntityIds[idx])
      }
      self.adapterEntityProcessWatchdogList[processEntityIds[idx]] = false
    }

    // respawn the 'crashed' processes.
    for (let idx=0; idx<processEntityIdsRespawn.length; idx++)
    {
      // store the configuration and the filename of the adpater we are going to respawn
      // this has to be done bevcause 'unregisterAdapter' will delete the entry in the 'adapterEntityProcesses' object
      var adapterConfiguration  = CloneDeep(self.adapterEntityProcesses[processEntityIdsRespawn[idx]].configuration)
      var file                  = self.adapterEntityProcesses[processEntityIdsRespawn[idx]].file
      // unregister the adapter and then do a respawn of the unregistered adapter
      this.unregisterAdapter(processEntityIdsRespawn[idx]).then(function(){
        self.logWarning('Respawning adapter entity process: ' + processEntityIdsRespawn[idx])
        self.registerAdapter(file,  processEntityIdsRespawn[idx], adapterConfiguration)
      })
    }
  }


  updateConfiguration(_configuration)
  {
    const self = this

    // use external configuration for the built in adapters
    self.configuration = CloneDeep(_configuration)

    self.configuration.comgateway                     = self.configuration.comgateway ? self.configuration.comgateway : {}
    self.configuration.comgateway.port                = self.configuration.comgateway.port ? self.configuration.comgateway.port : 3030
    self.configuration.comgateway.clientPingInterval  = self.configuration.comgateway.clientPingInterval ? self.configuration.comgateway.clientPingInterval : 30000

    self.configuration.webserver          = self.configuration.webserver ? self.configuration.webserver : {}
    self.configuration.webserver.enabled  = self.configuration.webserver.hasOwnProperty('enabled') ? self.configuration.webserver.enabled : true
    self.configuration.webserver.port     = self.configuration.webserver.port ? self.configuration.webserver.port : 8090
    // TODO: use another path ?!, this one is only for developing
    self.configuration.webserver.path     = self.configuration.webserver.path ? self.configuration.webserver.path :  __dirname + '/web/build/default'

    self.configuration.sysinfo            = self.configuration.sysinfo ? self.configuration.sysinfo : {}
    self.configuration.sysinfo.enabled    = self.configuration.sysinfo.hasOwnProperty('enabled') ? self.configuration.sysinfo.enabled : true
    self.configuration.sysinfo.interval   = self.configuration.sysinfo.interval ? self.configuration.sysinfo.interval : 2500

    self.configuration.logger             = self.configuration.logger ? self.configuration.logger : {}
    self.configuration.logger.enabled     = self.configuration.logger.hasOwnProperty('enabled') ? self.configuration.logger.enabled : true
    self.configuration.logger.logLevel    = self.configuration.logger.logLevel ? self.configuration.logger.logLevel : (process.env.HABITAT_LOGLEVEL ? process.env.HABITAT_LOGLEVEL :  LogLevel.INFO)

    self.configuration.adapterProcessWatchdog           = self.configuration.adapterProcessWatchdog ? self.configuration.adapterProcessWatchdog : {}
    self.configuration.adapterProcessWatchdog.enabled   = self.configuration.adapterProcessWatchdog.hasOwnProperty('enabled') ? self.configuration.adapterProcessWatchdog.enabled : true
    self.configuration.adapterProcessWatchdog.interval  = self.configuration.adapterProcessWatchdog.interval ? self.configuration.adapterProcessWatchdog.interval : 5000
  }


  sendStateUpdateToComGatewayProcess(_path, _value, _previousValue)
  {
    if(this.adapterEntityProcesses['COMGATEWAY'])
        this.sendToAdapter("COMGATEWAY", {data : {  action        : "stateUpdate",
                                                    path          : _path,
                                                    value         : _value,
                                                    previousValue : _previousValue } })
  }


  sendToLoggerProcess(_type, _moduleId, _entityId, _log, _object)
  {
    if(this.adapterEntityProcesses['LOG'])
      this.sendToAdapter("LOG", {data : { type      : _type,
                                          moduleId  : _moduleId,
                                          entityId  : _entityId,
                                          text      : _log } })
  }


  sendToAdapter(_adapterEntityId, _message)
  {
    if(!this.getAdapterProcess(_adapterEntityId))
    {
      this.logError('Failed sending data to process! Adapter entity process \'' + _adapterEntityId + '\' not present!' )
      return
    }
    // check if the adapter process is connected before sending to it, otherwise this would lead
    // to bad exceptions we cant catch and we dont like at all here
    if(this.getAdapterProcess(_adapterEntityId).connected && !this.getAdapterProcess(_adapterEntityId).killed)
    {
      this.getAdapterProcess(_adapterEntityId).send(_message)
      this.statistics.counters.messages.adapters.out++
    }
  }


  unregisterAdapter(_adapterEntityId)
  {
    const self = this

    self.logDebug('Unregister adapter process \'' + _adapterEntityId +'\'')

    return new Promise(function(_resolve, _reject) {
      if(self.adapterEntityProcesses[_adapterEntityId])
      {
        self.statistics.counters.processes.active--

        // remove the adapter entity from the watchdog list
        delete self.adapterEntityProcessWatchdogList[_adapterEntityId]

        self.sendToAdapter(_adapterEntityId, { adapter : { action : 'close' } } )
        setTimeout(function(){
          if(self.getAdapterProcess(_adapterEntityId))
            self.getAdapterProcess(_adapterEntityId).kill()
          // remove the process and its settings from the process list
          delete self.adapterEntityProcesses[_adapterEntityId]
          _resolve()
        }, 750)
      }
      else
      {
        self.logWarning('Unregister of adapter process \'' + _adapterEntityId +'\' failed: No such process for the given entityId')
        _resolve()
      }

    })
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
      let adapterFile
      self.adapterEntityProcesses[_adapterEntityId] = {}
      // the '_adapterFile' my be a filename only (then the sytem searches in the internal habitat adapter folder)
      // or a complete path with filename. This is defined by the 'EXT#' prefix and defines an external, non system adapter
      if(_adapterFile.startsWith('EXT#'))
        adapterFile = _adapterFile.substring(4, _adapterFile.length)
      else
        adapterFile = __dirname + '/processes/habitat.process.adapter.' + _adapterFile

      self.adapterEntityProcesses[_adapterEntityId].process = childProcess.fork(adapterFile, [_adapterEntityId])
      self.getAdapterProcess(_adapterEntityId).on('message', function(_message){
        self.onAdapterMessage(_message)
      })

      // store the settings of the adapter process for later use (e.g. process watchdog)
      // ATTENTION: The original filename has to be stored!
      self.adapterEntityProcesses[_adapterEntityId].file          = _adapterFile
      self.adapterEntityProcesses[_adapterEntityId].configuration = CloneDeep(_adapterConfiguration)

      // after we have set up the adapter process we do send a setup attempt.
      // ATTENTION: we can not be sure that the process was started correctly, we may have to do better in future versions
      self.sendToAdapter(_adapterEntityId, { adapter : { action : 'setup', configuration : _adapterConfiguration } } )

      // add the adpater entity to the watchdog list after a view seconds so that the adapter is
      // able to start up and to do the alive pinging watchdog stuff
      if(self.configuration.adapterProcessWatchdog.enabled)
      {
        setTimeout(function(){
          self.logTrace('Added adapter entity process \'' + _adapterEntityId + '\' to the process watchdog')
          self.adapterEntityProcessWatchdogList[_adapterEntityId] = 0
        }, 2500)
      }

      self.logDebug('Registered process for adapter entity \'' + _adapterEntityId + '\'')
    }
    catch(_exception)
    {
      self.logError('Registering process for adapter entity \'' + _adapterEntityId + '\' failed!')
    }
  }


  getAdapterProcess(_adapterEntityId)
  {
    if(this.adapterEntityProcesses[_adapterEntityId])
      return this.adapterEntityProcesses[_adapterEntityId].process
    return null
  }


  onAdapterMessage(_message)
  {
    // so here we get messages from all adapters which may be a little bottleneck
    // we have to check if this is going to be a problem.
    this.statistics.counters.messages.adapters.in++

    // all adapters are sending us a 'ping' event about each second
    // if this happens we have to mark the entotyid in the watchlist as 'alive and working hard'
    if(_message.adapter && _message.adapter.ping)
      this.adapterEntityProcessWatchdogList[_message.adapter.entity.id] = true

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
      // every adapter does have an 'adapter state object' which should include infos like connection status aso...
      // we do store this data into the global entity state object too
      this.updateEntityState(_message.adapter.entity.id, _message.adapter.entity, _message.adapter.state, {}, {} )
      this.emit("adapterStateReceived", _message.adapter.entity, _message.adapter.state)
    }

    // we may get an entity state update info from an adapter (e.g. comGateway)
    // this is a special data protocol which has to be the same for every adapter who is sending entity states to the system
    if(_message.entity && _message.entityState)
      this.emit('entityStateReceived', _message.adapter.entity, _message.entity, _message.entityState, _message.originator)

    // if the message has a 'data' attribute, we do only emit the data for the adapter entity
    // the 'data' attribute does container the adapter specific protocol. This data will be evaluated on the specific node-red adapter node
    if(_message.data)
      this.emit('adapterMessageReceived', _message.adapter.entity, _message.data)

  }


    // TODO: @@@ ??? Needed???
  onNodeMessage()
  {

  }


  updateEntityState(_entityId, _entity, _entityState, _originator = {}, _specification = {})
  {
    try
    {
      this.logTrace('State update for entity id: ' + _entityId + ' by ' + (_originator ? _originator.id : 'unknown'))

      // be sur ethe entity obect does containe the entity id
      _entity.id = _entity.id ? _entity.id : _entityId

      // if there is no entry for the entity state we have to create one before we can merge
      if(!this.getEntityStates()[_entityId])
        this.getEntityStates()[_entityId] = { entity : {}, state : {} , originator : {}, specification : {} }

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

    this.statistics.counters.states.updates++

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


  calcStatistics()
  {
    // TODO: @@@

    /*
    this.statistics = { counters :  { processes:  { active : 0 },
    messages:   { adapters : { in : 0, out : 0 } },
    states:     { updates : 0 }
  }
}*/
    let entityId = this.getEntityId()

    // calc the overall message count from the adapters and all other messages that are beeing processed by the habitat app
    let msgCountOverall = this.statistics.counters.messages.adapters.in + this.statistics.counters.messages.adapters.out

    // calc the overall message count per interval
    let msgCountIntervalIn      =  this.statistics.counters.messages.adapters.in  - this.statistics.counters.messages.adapters.inPrev
    let msgCountIntervalOut     =  this.statistics.counters.messages.adapters.out - this.statistics.counters.messages.adapters.outPrev
    let msgCountIntervalOverall = msgCountIntervalIn + msgCountIntervalOut

    // calc the overall average throughput of messages per intervall, we will use a sample of 5 intervalls for that
    // TODO: @@@
    let msgCountIntervalAvg = 0
    this.statistics.counters.messages.overallCount.unshift(msgCountIntervalOverall)
    if(this.statistics.counters.messages.overallCount.length > 5)
      this.statistics.counters.messages.overallCount.pop()
    for(let idx=0; idx<this.statistics.counters.messages.overallCount.length; idx++)
      msgCountIntervalAvg += this.statistics.counters.messages.overallCount[idx]
    msgCountIntervalAvg = msgCountIntervalAvg / 5

    // store previous
    this.statistics.counters.messages.adapters.inPrev   = this.statistics.counters.messages.adapters.in
    this.statistics.counters.messages.adapters.outPrev  = this.statistics.counters.messages.adapters.out

    // create the system 'APP' ntry as state
    if(!this.getEntityStates()[entityId])
    {
      this.getEntityStates()[entityId] = {}
      this.getEntityStates()[entityId].entity = { id : entityId, moduleId : this.getEntityModuleId() }
      this.getEntityStates()[entityId].state  = { system : { messages : {} } }
    }

    // update the message counter states
    this.getEntityStates()[entityId].state.system.messages.overall          = msgCountOverall
    this.getEntityStates()[entityId].state.system.messages.perInterval      = msgCountIntervalOverall
    this.getEntityStates()[entityId].state.system.messages.perIntervalAvg   = msgCountIntervalAvg
  }


  close()
  {
    const self = this
    return new Promise(function(_resolve, _reject) {

      // clear the process watchdog interval
      if(self.adapterEntityProcessWatchdogIntervalId)
        clearInterval(self.adapterEntityProcessWatchdogIntervalId)

      // send close demand to all the adapter process we have started and wait for a little time for them to process the
      // message and to quit gracefully
      const processEntityIds = Object.keys(self.adapterEntityProcesses)
      for(let procIdx=(processEntityIds.length-1); procIdx>=0; procIdx--)
      {
        self.logDebug('Request shutdown on adapter process \'' + processEntityIds[procIdx] +'\'')
        // remove the adapter entity from the watchdog list
        delete self.adapterEntityProcessWatchdogList[processEntityIds[procIdx]]
        // send the close request to the adapter process
        self.sendToAdapter(processEntityIds[procIdx], { adapter : { action : 'close' } } )
      }

      setTimeout(function(){
        // after waiting a little bit for the processes to kill themselve, we do send them a kill request
        // that doesn't mean that they will be forced to close, but let's have some trust in our child processes
        for(let procIdx=0; procIdx<processEntityIds.length; procIdx++)
        {
          if(self.getAdapterProcess(processEntityIds[procIdx]))
            self.getAdapterProcess(processEntityIds[procIdx]).kill()
          delete self.adapterEntityProcesses[processEntityIds[procIdx]]
        }
        _resolve()
      }, 750)
    })
  }
}


module.exports = Habitat