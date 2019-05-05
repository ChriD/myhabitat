
'use strict'

const HabitatAdapter    = require("./habitat.adapter.js")
const Crypto            = require("crypto")
const WebSocket         = require('ws')
const Get               = require('lodash.get')
const Set               = require('lodash.set')


class HabitatAdapter_ComGateway extends HabitatAdapter
{
  constructor(_entityId)
  {
    super(_entityId)

    this.webSocketServer        = null

    this.clientPingInterval     = 30000
    this.clientPingIntervalId   = 0

    // this is a copy of the state objects of the habitat system
    // in fact its only a cache so that when a new client connects to the gateway we do not need to fetch the
    // whole states from the main process again to get the client on an 'up to date' state
    this.cachedEntityStates = {}

    this.adapterState.connection = {}
    this.adapterState.connection.port             = 0
    this.adapterState.counters = {}
    this.adapterState.counters.activeClients      = 0
    this.adapterState.counters.pings              = 0
    this.adapterState.counters.pongs              = 0

  }

  getEntityModuleId()
  {
    return "COMGATEWAY"
  }


  setup(_configuration)
  {
    super.setup(_configuration)
    this.setupSocket()
  }


  close()
  {
    this.logDebug('Closing communication gateway socket')

    if(this.clientPingIntervallId)
      clearInterval(this.clientPingIntervallId)

    if(this.webSocketServer)
    {
      this.webSocketServer.close()
      this.webSocketServer = null
    }

    super.close()
  }


  input(_data)
  {
    _data.action    = _data.action   ? _data.action.toUpperCase()    : "WRITE"

    switch(_data.action)
    {
      case "WRITE":
        this.sendToClient(_data.clientData)
        break
      case "STATEUPDATE":
        this.stateUpdate(_data.path, _data.value, _data.previousValue)
        break
      default:
        this.logError('Action \'' + _data.action + '\' not found!')
    }
  }


  setupSocket()
  {
    const self = this

    self.adapterState.counters.activeClients  = 0
    self.adapterState.counters.pings          = 0
    self.adapterState.counters.pongs          = 0

    try
    {
      if(self.webSocketServer)
        self.close()

      self.webSocketServer = new WebSocket.Server({ port: self.configuration.port })
      self.webSocketServer.on('connection', function(_webSocket){
        self.clientConnected(_webSocket)
      })
      self.logInfo("Communication gateway is running on port: " + self.configuration.port.toString())
    }
    catch(_exception)
    {
      self.logError("Failed running communication gateway" , _exception)
      throw _exception
    }

    self.clientPingInterval = self.configuration.clientPingInterval ? self.configuration.clientPingInterval : self.clientPingInterval

    // we do want to check the connection for all clients with a ping
    // if the client does not response within the polling time, its connection will be terminated
    self.clientPingIntervalId = setInterval(function ping() {
      if(self.webSocketServer && self.webSocketServer.clients)
      {
        self.webSocketServer.clients.forEach(function each(_webSocket) {
          if (_webSocket.isAlive === false)
          {
            self.logWarning("Client " + _webSocket.id + " does not respond! Attend disconnect!")
            self.clientDisconnected(self.getClientInfo(_webSocket))
            return _webSocket.terminate()
          }
          _webSocket.isAlive = false
          self.adapterState.counters.pings++
          self.logDebug("Ping client " + _webSocket.id)
          _webSocket.ping()

        })
      }
    }, self.clientPingInterval)


    self.adapterState.connection.port = self.configuration.port

  }

  getClientInfo(_webSocket)
  {
    return { id : _webSocket.id }
  }


  setClientInfo(_webSocket)
  {
    _webSocket.id = Crypto.randomBytes(16).toString("hex");;
  }


  clientConnected(_webSocket)
  {
    var self = this

    // store some unique id information to the websocket connection
    self.setClientInfo(_webSocket)

    self.logInfo("New client connected: " + _webSocket.id)

    // create a detection of broken client connections
    _webSocket.isAlive = true
    _webSocket.on('pong', function(){
      this.isAlive = true
      self.adapterState.counters.pongs++
      self.logDebug("Client " + _webSocket.id + " noticed with a pong!")
    })

    // something has connected to the socket, we do listen for messages from it
    _webSocket.on('message', function(_data) {
      self.clientMessageReceived(self.getClientInfo(_webSocket), _data)
    })

    // be sure we get the correct disconnection too
    _webSocket.on('close', function() {
      self.clientDisconnected(self.getClientInfo(_webSocket))
    })

    self.adapterState.counters.activeClients++

    // now that a new client is connected, we have to send him all the current states of
    // the system so that the client is up to date. For that we use the cached state data
    // given in the adapter. We do cache the data to keep the message flow between main process
    // and adapter pocess low!
    self.sendAllStatesToClient([_webSocket.id])

  }


  clientDisconnected(_clientInfo)
  {
    this.adapterState.counters.activeClients--
    this.logInfo("Client " + _clientInfo.id + " has disconnected")
  }


  clientMessageReceived(_clientInfo, _data)
  {
    this.logDebug('Got client message from ' + _clientInfo.id + ': ' + JSON.stringify(_data))

    // clients currently do send us only state updates, if there is no state information in the data
    // we skip it and give some warning in the log. In future we may have some deeper communication
    if(_data.entityState)
      this.output( { entityState : _data.entityState } )
    else
      this.logWarning('Client message does not contain workable data!')
  }


  sendAllStatesToClient(_clientIds = [])
  {
    this.logDebug('Sending all entity states to clients: ' + (_clientIds && _clientIds.length ? JSON.stringify(_clientIds)  : 'ALL'))
    const keys = Object.keys(this.cachedEntityStates)
    for(var idx=0; idx<keys.length; idx++)
    {
      let entityId = keys[idx]
      let message = this.createMessageProtocolObjectForState(entityId, '', this.cachedEntityStates[entityId].state, {}, this.cachedEntityStates[entityId].entity, this.cachedEntityStates[entityId].state, this.cachedEntityStates[entityId].originator, this.cachedEntityStates[entityId].specification)
      this.sendToClient(message, _clientIds)
    }
  }


  sendToClient(_data, _clientIds = [])
  {
    var self = this

    if(!self.webSocketServer)
      return

    self.webSocketServer.clients.forEach(function each(_client) {
      try
      {
        if(!_clientIds || !_clientIds.length || _clientIds.includes(_client.id))
        {
          if(_client.readyState === WebSocket.OPEN)
          {
            const bufferData = JSON.stringify(_data)
            self.logTrace('Send data to client ' + _client.id + ': ' + bufferData)
            _client.send(bufferData)
          }
        }
      }
      catch(_exception)
      {
        self.logError('Sending data to client failed:' + _client.id + ': ' + bufferData)
      }
    })
  }


  stateUpdate(_path, _value, _previousValue)
  {
    // cache the state for further use in our internal state cache
    // in fact this state cache data should be exactly the same as the one on the main process
    Set(this.cachedEntityStates, _path, _value)

    // skip 'originator', 'specification' and 'entity' changes, those we do not want to emit to the client
    // those objects are only interesting in 'real' state changed
    if(_path.includes('.originator') || _path.includes('.specification') || _path.includes('.entity'))
      return

    // get the entity id from the '_path' string.
    var entityId = _path.substring(0, _path.indexOf('.'))

    // direct updates on the root (no '.' in the path) object should not be sent to the clients.
    // Those updates are only triggered if the child objects 'state' and 'originator' are created due nonexistance
    if(!entityId)
      return

    // create a path string which matches the state object we are sending to the client
    // That means we have to remove the entityId and the 'state' string
    var cleanedPath = _path.substring((entityId + '.state.').length, _path.length)

    // send the entity state to the clients (the full one) with the info of the path which data has changed
    const message = this.createMessageProtocolObjectForState(entityId, cleanedPath, _value, _previousValue, this.cachedEntityStates[entityId].entity, this.cachedEntityStates[entityId].state, this.cachedEntityStates[entityId].originator, this.cachedEntityStates[entityId].specification)
    this.sendToClient(message)
  }


  createMessageProtocolObjectForState(_entityId, _path, _value, _previousValue, _entity, _state, _originator, _specification)
  {
    const envelope = {}

    envelope.protocol       = "HABITAT_ENTITYSTATE"
    envelope.version        = 1
    envelope.specification  = _specification
    envelope.originator     = _originator
    envelope.entityId       = _entityId
    envelope.entity         = _entity
    envelope.state          = _state
    envelope.path           = _path
    envelope.value          = _value
    envelope.previousValue  = _previousValue

    return envelope
  }


}


module.exports = HabitatAdapter_ComGateway