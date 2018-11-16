"use strict"

const Habitat_Base = require('./habitat-base.js')
const Habitat_Storage_File = require('./storage/habitat-storage.file.js')
const Habitat_HTTPServer = require('./server/habitat-httpServer.js')
const Glob = require('glob')
const Path = require('path')


/**
 *
 */
class Habitat_App extends Habitat_Base
{
  constructor()
  {
    super()
    // gateways are objects which communicate for example with a GUI
    // they are not present as nodes in node-red, they are built in into the app itself
    this.gateways = []

    // this is the storage object for storing data and states
    // currently the storage is a file storage, if we do want to have another (maybe db) we have to
    // create a new inheritance from the storage base class
    this.storage = new Habitat_Storage_File()

    // this is the HTTP server for serving GUIs for the habitat app
    // it may not be used if the gui's are present on another server
    this.guiServer = new Habitat_HTTPServer(8080)
  }

  /**
   * this method has to be called after the event subscription has been done
   * it will initialize the gateways and load the stored data
   */
  init()
  {
    this.initGateways()
    //this.initGUIServer()
  }


  /**
   * this method has to be called when the habitat app is beeing closed
   * it will cloas all the gateway connections
   */
  close()
  {
    this.closeGateways()
    this.closeGUIServer()

  }

  initGUIServer()
  {
    var self = this

    if(!self.guiServer)
      return
    // the logs of the webserver should be redirected to the application main log
    self.guiServer.on("log", function(_logType, _log, _data) {
      self.log(_logType, _log, _data)
    })

    self.guiServer.listen()

  }

  closeGUIServer()
  {
    if(!this.guiServer)
      return
    this.guiServer.close()
  }

  /**
   * this method searches for available gateway classes and starts all of them
   * the gateway objects are stored internally by the habitat app
   * gateways are for the connection with clients (e.g to interact with a GUI)
   */
  initGateways()
  {
    var self = this

    try
    {
      // get all files which are gateway classes and create an object for each of them
      // INFO:  This may change in the future, i am not sure if we do need it like this
      //        I think its better to create nodes for the gateway and to find them in the main node?!
      var gatewayFilePathPattern = __dirname + '/gateways/habitat-gateway.*.js'
      var files = Glob.sync(gatewayFilePathPattern)
      if(!files || !files.length)
        throw Error("No gateway files found!")

      for (var i=0; i < files.length; i++)
      {
        try
        {
          var GatewayDesc = new require(Path.resolve(files[i]))
          var gateway = new GatewayDesc()
          self.gateways.push(gateway)

          // the logs of the gateways should be redirected to the application main log
          gateway.on("log", function(_logType, _log, _data){
            self.log(_logType, _log, _data)
          })

          // the received messages should be known by the app and the app will create an emit itself too
          // do all the clients may subscrive to the event
          gateway.on("clientMessageReceived", function(_clientInfo, _habitatEnvelope){
            self.logInfo("Received data from " + _habitatEnvelope.sender)
            self.emit("receivedDataFromClient", _clientInfo, _habitatEnvelope)
          })

          // the clientConnected event should be known by the app and the app will create an emit itself too
          // when a client is connecting, the nodes hav to send their state to the client
          gateway.on("clientConnected", function(_clientInfo){
            self.emit("clientConnected", _clientInfo)
          })

          // start/run the gateway
          gateway.run()

          self.logInfo("Gateway " + gateway.name() + " started")
        }
        catch(_exception)
        {
          // if there was an error creating a gateway we should not kill the whole app
          // we give some error and the app may run without that gateway
          self.logError("Error creating gateway object from file " + files[i], _exception)
        }
      }
    }
    catch(_exception)
    {
      // there is a problem in getting the files
      self.logError("Error loading files from path pattern " + gatewayFilePathPattern, _exception)
    }
  }

  /**
   * this method closes all the gateways which means all connections to clients will be closed
   */
  closeGateways()
  {
    var self = this
    for (var i=(self.gateways.length - 1); i >= 0; i--)
    {
      try
      {
        self.gateways[i].close()
        self.gateways.splice(i, 1)
      }
      catch(_exception)
      {
        self.logError("Error closing gateway " + self.gateways[i].name, _exception)
      }
    }
  }


   /**
   * send data to clients via the registered gateways
   * @param {Object} _data data to send (JSON Object)
   * @param {String[]} _clientIds array of client ids where the data has to be sent
   */
  sendDataToClients(_data, _clientIds = [])
  {
    var self = this
    for (var i=(self.gateways.length - 1); i >= 0; i--)
    {
      try
      {
        self.gateways[i].send(JSON.stringify(_data))
      }
      catch(_exception)
      {
        self.logError("Error sending data on gateway " + self.gateways[i].name(), _exception)
      }
    }
  }


  /**
   * send current node state to client via the registered gateways
   * @param {Object} _node Habitat node
   * @param {String[]} _clientIds array of client ids where the data has to be sent
   */
  sendNodeStateToClients(_node, _clientIds = [])
  {
    var self = this
    var envelope = {}

    // pack the current state into a data envelope and send it to all clients
    envelope.protocol     = "HABITAT_ENVELOPE"
    envelope.version      = 1
    envelope.sender       = "HABITAT"
    envelope.senderUnique = "HABITAT"
    envelope.nodeId       = _node.getNodeId()
    envelope.type         = "NODESTATE"
    envelope.data         = _node.state

    self.sendDataToClients(envelope, _clientIds)
  }

   /**
   * this method stores a state
   * @param {string} _objectId the object id where the state will be stored
   * @param {string} _stateId the stateId
   * @param {Object} _state the state object
   * @return {Promise} a promise
   */
  saveState(_objectId, _stateId, _state)
  {
    return this.storage.saveState(_objectId, _stateId, _state)
  }

  /**
   * this method loads a state
   * @param {string} _objectId the object id where the state will be stored
   * @param {string} _stateId the stateId
   * @return {Promise} a promise
   */
  loadState(_objectId, _stateId)
  {
    return this.storage.loadState(_objectId, _stateId)
  }



}


module.exports = Habitat_App