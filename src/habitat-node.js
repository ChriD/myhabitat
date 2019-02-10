
const Logger = require('./libs/logger.js')

"use strict"


/**
 * This is the node base class for all nodes which are in relation to habitat
 */
class Habitat_Node
{
  constructor(_RED, _config)
  {
    var self = this

    self.config   = _config
    self.stateId  = ''

    // adapters may have a lot of listeners due nodes do attach to them
    _RED.events.setMaxListeners(100)
    _RED.events.once("nodes-started",function() { self.nodesStarted() })
  }

  /**
   * should return a ID where the habitat application instance is stored in the global context
   * @return {string} the id of the context storage
   */
  getHabitatGlobalContextId()
  {
    return "HABITAT"
  }

   /**
   * should return a ID where the habitat adapter instances are stored in the global context
   * @return {string} the id of the context storage
   */
  getHabitatAdaptersGlobalContextId()
  {
    return "HABITAT_ADAPTERS"
  }

  /**
   * should return a unique persistant id of the node
   * has to be overwritten!
   * @return {string}
   */
  getNodeId()
  {
    throw Error("getNodeId has to be overwitten!")
  }

  /**
   * returns the id for the 'default' (last) state of the node
   * this is the one which will be stored and loaded automatically
   * @return {string}
   */
  getLastStateId()
  {
    return "LAST"
  }

  /**
   * returns the habitat application node
   * @return {Object} the habitat application node
   */
  habitatNode()
  {
    return this.context().global.get(this.getHabitatGlobalContextId())
  }

  /**
   * returns the habitat application
   * @return {Object} the habitat application
   */
  habitat()
  {
    if(!this.habitatNode())
      return null
    return this.habitatNode().habitat
  }


  /**
   * returns the adapters registered for the habitat app
   * @return {Object[]} registered adapters
   */
  adapters()
  {
    return this.context().global.get(this.getHabitatAdaptersGlobalContextId())
  }

  /**
   * will be called after the createNode of the RED application
   */
  created()
  {
    this.on('close', function(){ this.onClose() })
  }

  /**
   * will be called when all nodes are started
   */
  nodesStarted()
  {
  }

  /**
   * will be called when node is closing
   */
  close()
  {
  }

  /**
   * should return true if the node should save and load the state automatically
   * @return {boolean} state enbaled or disabled
   */
  stateStorageEnabled()
  {
    return false
  }

  /**
   * use this method to load a specific state for the node
   * @param {string} _stateId the stateId
   * @param {boolean} _isInit indicates if the loaded state was loaded because of initialization of the node
   */
  loadState(_stateId, _isInit)
  {
    var self = this

    return new Promise((_resolve, _reject) => {
      try
      {
        // skip loading of states if node does not have the ability for it!
        if(!self.stateStorageEnabled())
        {
          _resolve()
        }
        else
        {
          self.habitat().loadState(self.getNodeId(), _stateId).then(function(_state){
            self.setState(_state, _isInit).then(function(){
              _resolve()
            }).catch(function(_exception){
              _reject(_exception)
            })
          }).catch(function(_exception){
            self.logError("Error loading state " + self.getLastStateId() + " for node " + self.getNodeId() +  ": " + _exception.toString(), _exception)
            _reject(_exception)
          })
        }
      }
      catch(_exception)
      {
        self.logError(_exception.toString())
        _reject(_exception)
      }
    })
  }

   /**
   * use this method to load a specific state for the node
   * @param {boolean} _isInit indicates if the loaded state was loaded because of initialization of the node
   * @return {Promise}
   */
  loadLastState(_isInit)
  {
    var self = this
    return self.loadState(self.getLastStateId(), _isInit)
  }

  /**
   * use this method to save a specific state for the node
   * @param {string} _stateId the stateId
   * @param {Object} _state the state
   */
  saveState(_stateId, _state)
  {
    var self = this

    // skip saving of states if node does not have the ability for it!
    if(!self.stateStorageEnabled())
      return

    // don't save the last state if we have loaded a scene, a scene should never
    // ovewrite tha last state object (we do need it again when scene was cleared)
    if(self.sceneId)
      return

    self.habitat().saveState(self.getNodeId(), _stateId, _state)
  }

  /**
   * use this method to save the current state
   */
  saveLastState()
  {
    // don't save the last state if we have loaded a scene, a scene should never
    // ovewrite tha last state object (we do need it again when scene was cleared)
    if(this.sceneId)
      return

    return this.habitat().saveState(this.getNodeId(), this.getLastStateId(), this.state)
  }

  /**
   * does set a new state to a node
   * @param {Object} _state the state object
   * @param {boolean} _isInit indicates if the loaded state was loaded because of initialization of the node
   */
  setState(_state, _isInit = false)
  {
    var self = this

    return new Promise((_resolve, _reject) => {
      try
      {
        // be sure the loaded state object is on the correct version
        self.upgradeState(_state)
        // if the state was 'loaded' by a init command we have to restore the old state values
        if(_isInit)
          self.restoreState(_state).then(function(){
            self.stateUpdated()
            _resolve()
          }).catch(function(_exception){
            self.logError("Error restoring state: " + _exception.toString(), _state)
            _reject(_exception)
          })
        // if the state is loaded by user we have to apply the new state values
        else
          self.applyState(_state).then(function(_dispatchState = true){
            // when the state was applied, we have to call 'stateUpdated' which will deliver the data to all clients
            // this may lead to multiple sending of a state when using KNX-Thing nodes with feddback ga's (due that feedback ga's will trigger 'stateUpdated') as well
            // so we do have the '_dispatchState' var for denying sending of a status
            if(_dispatchState)
              self.stateUpdated()
            _resolve()
          }).catch(function(_exception){
            self.logError("Error applying state: " + _exception.toString(), _state)
            _reject(_exception)
          })

      }
      catch(_exception)
      {
        self.logError(_exception.toString())
        _reject(_exception)
      }
    })
  }


   /**
   * will be called before a state is applied or restored
   * its here to 'upgrade' the state obkect
   */
  upgradeState(_state)
  {
  }


  /**
   * does combine 2 states with deep merging!
   */
  combineStates(_stateA, _stateB)
  {
    var newState = this.copyObject(_stateA)
    const cloner = require('cloner')
    newState = cloner.deep.merge(newState, _stateB)
    return newState

    //const deepmerge = require('deepmerge')
    //return deepmerge.all(_stateA, _stateB)

    // ECMA Script 2018
    //return {_stateA, _stateB}

    // ECMA Script 2015
    //return Object.assign(_stateA, _stateB)
  }

   /**
   * will be called when the last state of the node will be restored due blackout or redeploy
   */
  restoreState(_state)
  {
    //this.state = this.copyObject(_state)
  }

  /**
   * will be called when the state of the node was changed by the user (eg. scene)
   */
  applyState(_newState)
  {
    //this.state = this.copyObject(_state)
  }

  /**
   * will be called when the state object has changed
   * there is no oserver on the state object, it has to be done manually!
   */
  stateUpdated()
  {
    this.updateNodeInfoState()
  }


  /**
   * should be called when the appearnce of the node in the node-red gui has to be updates
   * in this case we do show the current position of the blind (position + degree)
   */
  updateNodeInfoState()
  {
  }

  /**
   *
   * @param {anytpe} _value the value which should be converted to integer
   * @return {Integer} the integer value of the given param
   */
  toInt(_value)
  {
      try
      {
        if(typeof _channel == "number")
          return _value
        return parseInt(_value)
      }
      catch(_exception)
      {
        this.logError("Cant parse" + _value + " to integer")
      }
      return 0
  }

  /**
   * deep-copy a object
   * @param {Object} _object the object to copy
   * @return {Object} a copy of the object
   */
  copyObject(_object)
  {
    if(_object)
      return JSON.parse(JSON.stringify(_object))
    return null
  }

  /**
   * returns the prefix for the logs. should be overwritten
   * @return {String} the prefix for every log
   */
  getLogPrefix()
  {
    return ""
  }

  /**
   * @return {String}
   */
  getLogUnique()
  {
    return ""
  }


  logInt(_type, _log, _object)
  {
    // redirect all logs from the node to the main habitat application node which will
    // do the output of the log to clients or any other log related stuff.
    if(this.habitat())
      this.habitat().nodeLog(_type, this.getLogPrefix(), this.getLogUnique(), _log, _object)
    // TODO: @@@ what if the habitat instance is not already there?
    // --> create a logger class which resides in the global varuiable scope???
  }


  logError(_log, _object)
  {
    this.logInt(Logger.LogType.ERROR, _log, _object)
  }


  logWarning(_log, _object)
  {
    this.logInt(Logger.LogType.WARNING, _log, _object)
  }


  logInfo(_log, _object)
  {
    this.logInt(Logger.LogType.INFO, _log, _object)
  }


  logDebug(_log, _object)
  {
    this.logInt(Logger.LogType.DEBUG, _log, _object)
  }


  logSilly(_log, _object)
  {
    this.logInt(Logger.LogType.SILLY, _log, _object)
  }

}

module.exports = Habitat_Node

