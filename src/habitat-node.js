
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
    // TODO: @@@
    //self.habitat().removeListener("receivedDataFromClient")
  }

  /**
   * should return true if the node does have a state object
   * @return {boolean} state enbaled or disabled
   */
  stateEnabled()
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

    // skip loading of states if node does not have the ability for it!
    if(!self.stateEnabled())
      return

    self.habitat().loadState(self.getNodeId(), _stateId).then(function(_state){
      self.setState(_state, _isInit)
    })
    .catch(function(_exception){
      self.logError("Error loading state " + self.getLastStateId() + " for node " + self.getNodeId() +  ": " + _exception.toString(), _exception)
    })
  }

   /**
   * use this method to load a specific state for the node
   * @param {boolean} _isInit indicates if the loaded state was loaded because of initialization of the node
   */
  loadLastState(_isInit)
  {
    var self = this
    self.loadState(self.getLastStateId(), _isInit)
  }

  /**
   * use this method to save a specific state for the node
   * @param {string} _stateId the stateId
   * @param {Object} _state the state
   */
  saveState(_stateId, _state)
  {
    // skip saving of states if node does not have the ability for it!
    if(!self.stateEnabled())
      return

    this.habitat().saveState(this.getNodeId(), _stateId, _state)
  }

  /**
   * use this method to save the current state
   */
  saveLastState()
  {
    this.habitat().saveState(this.getNodeId(), this.getLastStateId(), this.state)
  }

  /**
   * does set a new state to a node
   * @param {Object} _state the state object
   * @param {boolean} _isInit indicates if the loaded state was loaded because of initialization of the node
   */
  setState(_state, _isInit = false)
  {
    var self = this
    // be sure the loaded state object is on the correct version
    this.upgradeState(_state)
    // if the state was 'loaded' by a init command we have to restore the old state values
    if(_isInit)
      this.restoreState(_state).then(function(){
        self.stateUpdated()
      })
    // if the state is loaded by user (scene change) we have to apply the new state values
    else
      this.applyState(_state).then(function(){
        self.stateUpdated()
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
   * does combine 2 states
   */
  combineStates(_stateA, _stateB)
  {
    // ECMA Script 2018
    //return {_stateA, _stateB}

    // ECMA Script 2015
    return Object.assign(_stateA, _stateB);
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
  }

  /**
   * will be called when node is closing
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
      return JSON.parse(JSON.stringify(_object))
  }

  /**
   * returns the prefix for the logs. should be overwritten
   * @return {String} the prefix for every log
   */
  getLogPrefix()
  {
    return ""
  }

  logInt(_type, _log, _object)
  {
    this.habitat().log(_type, this.getLogPrefix() + " " + _log, _object)
    //this.emit("log", _type, _log, _object)
  }


  logError(_log, _object)
  {
    this.logInt(0, _log, _object)
  }


  logWarning(_log, _object)
  {
    this.logInt(1, _log, _object)
  }


  logInfo(_log, _object)
  {
    this.logInt(2, _log, _object)
  }


  logDebug(_log, _object)
  {
    this.logInt(3, _log, _object)
  }

}

module.exports = Habitat_Node

