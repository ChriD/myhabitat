"use strict"

const Habitat_Base = require('../habitat-base.js')


/**
 * This is the gateway base class for communicating with clients (e.g GUI) via any type of connection (e.g Sockets, ...)
 * See method documentation which methods have to be overloaded and what they shoud do!
 */
class Habitat_Gateway extends Habitat_Base
{
  constructor()
  {
    super()
  }


  /**
   * should return the name of the gateway
   * has to be overwritten!
   * @return {string}
   */
  name()
  {
    return ""
  }

   /**
   * returns the prefix for the logs. should be overwritten
   * @return {String} the prefix for every log
   */
  getLogPrefix()
  {
    return "[" + this.name() + "]:"
  }


  /**
   * should init the gateway and start the listening for clients
   * has to be overwritten!
   */
  run()
  {
  }


  /**
   * should close the gateway and all the clients
   * should to be overloaded! but be sure you call the super!
   */
  close()
  {
    this.removeAllListeners()
  }


  /**
   * should send messages to all the clients given in the 'clientIds' array
   * if the array is emoty it should deliver the message to all clients
   * has to be overwritten!
   * @param {Object} _data message which should be sent to the client
   * @param {string[]} _clientIds array of client ids where the message should be delivery, if empty array all clients must get the message
   */
  send(_data, _clientIds = [])
  {
    this.logDebug("Sending data: " + JSON.stringify(_data), _data)
  }


  /**
   * should be called when a client has connected to the gateway
   * @param {Object} _clientInfo a client info object containing at least a 'id'
   */
  clientConnectedEvent(_clientInfo)
  {
    this.emit("clientConnected", _clientInfo)
  }


  /**
   * should be called when a client has been disconnected from the gateway
   * @param {Object} _clientInfo a client info object containing at least a 'id'
   */
  clientDisconnectedEvent(_clientInfo)
  {
    this.emit("clientDisconnected", _clientInfo)
  }


  /**
   * should be called when a client has sent us a message
   * @param {Object} _clientInfo a client info object containing at least a 'id'
   * @param {Object} _data the message sent by the client
   */
  clientMessageReceivedEvent(_clientInfo, _data)
  {
    this.emit("clientMessageReceived", _clientInfo, JSON.parse(_data))
  }

}

module.exports = Habitat_Gateway

