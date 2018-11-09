"use strict"

const Crypto          = require("crypto")
const WebSocket       = require('ws')
const Habitat_Gateway = require('./habitat-gateway.js')


/**
 * This is the Websocket gateway class for communicating with clients (e.g GUI) via websockets
 * It does handle broken connections via a ping/pong system
 */
class Habitat_Gateway_Websockets extends Habitat_Gateway
{

  constructor()
  {
    super()
    this.webSocketServer          = null
    this.port                     = 3030
    this.clientPingIntervallId    = 0;
    this.clientPingIntervall      = 30000;
  }

  /**
   * returns the name of the gateway
   * @return {string} the name of the gateway
   */
  name()
  {
    return "WEBSOCKETS"
  }


  getClientInfo(_webSocket)
  {
    return { id : _webSocket.id }
  }


  setClientInfo(_webSocket)
  {
    _webSocket.id = Crypto.randomBytes(16).toString("hex");;
  }

  /**
   * use this method to start the gateway.
   * it should only be called once
   */
  run()
  {
    var self = this

    try
    {
      // if we have already an active server we have to close it before!
      if(self.webSocketServer)
        self.close()

      self.webSocketServer = new WebSocket.Server({ port: self.port })
      self.webSocketServer.on('connection', function(_webSocket){
        self.clientConnected(_webSocket)
      })
      self.logInfo("Gateway is running on port: " + self.port.toString())
    }
    catch(_exception)
    {
      self.logError("Failed running gateway" , _exception)
      throw _exception
    }

    // we do want to check the connection for all clients with a ping
    // if the client does not response within the polling time, its connection will be terminated
    self.clientPingIntervallId = setInterval(function ping() {
      self.webSocketServer.clients.forEach(function each(_webSocket) {
        if (_webSocket.isAlive === false)
        {
          self.logWarning("Client " + _webSocket.id + " was disconnected due no response!")
          self.clientDisconnectedEvent(self.getClientInfo(_webSocket))
          return _webSocket.terminate()
        }
        _webSocket.isAlive = false
        _webSocket.ping();
      })
    }, self.clientPingIntervall)

  }


  clientConnected(_webSocket)
  {
    var self = this

    self.logDebug("New client connected")

    // create a detection of broken client connections
    _webSocket.isAlive = true
    _webSocket.on('pong', function(){
      this.isAlive = true
    })

    // store some unique id to the websocket connection
    self.setClientInfo(_webSocket)

    self.clientConnectedEvent(self.getClientInfo(_webSocket))

    // something has connected to the socket, we do listen for messages from it
    _webSocket.on('message', function(_data) {
      self.clientMessageReceivedEvent(self.getClientInfo(_webSocket), _data)
    })

    // be sure we get the correct disconnection too
    _webSocket.on('close', function() {
      self.logInfo("Client " + _webSocket.id + " has disconnected")
      self.clientDisconnectedEvent(self.getClientInfo(_webSocket))
    })

  }


  close()
  {
    var self = this

    try
    {

      super.close()

      if(self.clientPingIntervallId)
        clearInterval(self.clientPingIntervallId)

      if(self.webSocketServer)
      {
        self.webSocketServer.close()
        self.webSocketServer = null
        self.logDebug("Gateway closed")
      }
    }
    catch(_exception)
    {
      self.logError("Error closing gateway")
      throw _exception
    }
  }


  send(_data, _clientIds = [])
  {
    var self = this

    if(!self.webSocketServer)
      return

    super.send(_data, _clientIds)

    self.webSocketServer.clients.forEach(function each(_client) {
      try
      {
        if(_client.readyState === WebSocket.OPEN)
          _client.send(_data)
      }
      catch(_exception)
      {
        self.logError("Error sending message to client " + _client.id)
      }
    })
  }


}

module.exports = Habitat_Gateway_Websockets
