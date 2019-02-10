"use strict"

const Habitat_Base = require('./habitat-base.js')
const Habitat_Storage_File = require('./storage/habitat-storage.file.js')
const Habitat_HTTPServer = require('./server/habitat-httpServer.js')
const Habitat_SceneManager   = require('./libs/sceneManager.js')
const Glob = require('glob')
const Path = require('path')
const Logger = require('./libs/logger.js').Logger


/**
 *
 */
class Habitat_App extends Habitat_Base
{
  constructor()
  {
    super()

    var self = this

    // the app may have a lot of listeners due nodes do attach to them
    this.setMaxListeners(100)

    // create a basic logger which wil lhandle all logs from all nodes and therfore all modules
    this.logger = new Logger()
    // the logger object will have all logs gathered together, and if any log appears we have to
    // send them to the clients which have subscribed to logging
    this.logger.on("log", function(_logData) {
      // @@@ ERROR!!!!
      //self.sendLogToClients(_logData)
    })

    // logs from the app class will be redirected to the logger object
    this.on("log", function(_logType, _logPrefix, _logUnique, _log, _data) {
      self.logger.add(_logType, _logPrefix, _logUnique, _log, _data)
    })

    // gateways are objects which communicate for example with a GUI
    // they are not present as nodes in node-red, they are built in into the app itself
    this.gateways = []

    // this is the storage object for storing data and states
    // currently the storage is a file storage, if we do want to have another (maybe db) we have to
    // create a new inheritance from the storage base class
    this.storage = new Habitat_Storage_File()

    // the scene manager object
    // it is a class which does have some functions for getting scene data and it stores the scene data too
    this.sceneManager = new Habitat_SceneManager()

    // this is the HTTP server for serving GUIs for the habitat app
    // it may not be used if the gui's are present on another server
    this.guiServer = new Habitat_HTTPServer(8080)
  }

  getLogPrefix()
  {
    return "[HABITAT]"
  }

  getLogUnique()
  {
    return ""
  }

  /**
   * this method has to be called after the event subscription has been done
   * it will initialize the gateways and load the stored data
   */
  init()
  {
    this.initGateways()
    this.initGUIServer()
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

  // all logs from nodes are gathered here in following method and will be hand over to the
  // main logger object which will do the logging for us
  nodeLog(_type, _logPrefix, _logUnique, _log, _object)
  {
    this.logger.add(_type, _logPrefix, _logUnique, _log, _object)
  }


  initGUIServer()
  {
    var self = this

    if(!self.guiServer)
      return
    // the logs of the webserver should be redirected to the application main log
    // the main log is stored in an array of log objects
    self.guiServer.on("log", function(_logType, _logSource, _logSourceId, _log, _additonalData) {
      self.logger.add(_logType, _logSource, _logSourceId, _log, _additonalData)
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
      self.logSilly("Init Gateways")
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
          self.logSilly("Creating gateway object from file: " + files[i])
          var GatewayDesc = new require(Path.resolve(files[i]))
          var gateway = new GatewayDesc()
          self.gateways.push(gateway)

          // the logs of the gateways should be redirected to the logger
          gateway.on("log", function(_logType, _logSource, _logSourceId, _log, _additionalData) {
            self.logger.add(_logType, _logSource, _logSourceId, _log, _additionalData)
          })

          // the received messages should be known by the app and the app will create an emit itself too
          // do all the clients may subscribe to the event
          gateway.on("clientMessageReceived", function(_clientInfo, _habitatEnvelope){
            self.logInfo("Received data from " + _habitatEnvelope.sender)
            self.clientMessageReceived(_clientInfo, _habitatEnvelope)
            self.emit("receivedDataFromClient", _clientInfo, _habitatEnvelope)
          })

          // the clientConnected event should be known by the app and the app will create an emit itself too
          // when a client is connecting, the nodes hav to send their state to the client
          gateway.on("clientConnected", function(_clientInfo){
            self.emit("clientConnected", _clientInfo)
          })

          // start/run the gateway
          self.logSilly("Starting gateway :" + gateway.name())
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


  clientMessageReceived(_clientInfo, _habitatEnvelope)
  {
    // a client may have some specific data requests which will be sent to him only like logs or a list off all state changed
    // state messages of the nodes are handled directly by the node base classes
    /*
    if(_habitatEnvelope.type == "DATAREQUEST")
    {
        if(_habitatEnvelope.data.type == "SYSTEM")
        if(_habitatEnvelope.data.type == "LOG")
        {
          if(_habitatEnvelope.data.level == "NONE")
          this.logSubscribers.remove
          this.logSubscribers.
          // TODO: add client to the log level data requestors
        }
    }
    */
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
        self.gateways[i].send(JSON.stringify(_data), _clientIds)
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
    envelope.originator   = _node.stateOriginator
    envelope.data         = _node.state

    self.sendDataToClients(envelope, _clientIds)
  }


  sendLogToClients(_logData)
  {
    // TODO: get clients who subscribed to logging and send by log level
    var self = this
    var envelope = {}
    var clientIds = []

    // pack the current state into a data envelope and send it to all clients
    envelope.protocol     = "HABITAT_ENVELOPE"
    envelope.version      = 1
    envelope.sender       = "HABITAT"
    envelope.senderUnique = "HABITAT"
    envelope.nodeId       = ""
    envelope.type         = "LOG"
    envelope.originator   = ""
    envelope.data         = _logData

    self.sendDataToClients(envelope, clientIds)
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

  /**
   * returns the scene manager object for the scenes
   * @return {Object} the scene manager
   */
  getSceneManager()
  {
    return this.sceneManager;
  }

}



module.exports = Habitat_App