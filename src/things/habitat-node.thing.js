
"use strict"

const Habitat_Node  = require('../habitat-node.js')


class Habitat_Node_Thing extends Habitat_Node
{
  constructor(_RED, _config)
  {
    super(_RED, _config)

    // every "Thing" does have a var which indicates the current scene on this thing
    // if the sceneIs is empty, there is no scene active
    this.sceneId = ''

    // get the defined adapter from the config
    // we will retrieve the adpater node and we can use the id of the node for the link
    var adapterNode = _RED.nodes.getNode(this.config.adapterNode)
    if(adapterNode)
      this.config.adapterId = adapterNode.getAdapterId()
  }

  /**
   * should return a unique persistant id of the thing
   * has to be overwritten!
   * @return {string}
   */
  getThingId()
  {
    return this.config.thingId
  }

  /**
   * should return the type of the thing
   * has to be overwritten!
   * @return {string}
   */
  getThingType()
  {
    return ""
  }

  /**
   * should return a unique persistant id of the node
   * @return {string}
   */
  getNodeId()
  {
    return this.getThingId()
  }

   /**
   * returns the prefix for the logs. should be overwritten
   * @return {String} the prefix for every log
   */
  getLogPrefix()
  {
    return "[" + this.getThingType() + "] " + this.getThingId() + ":"
  }

  /**
   * should return true if the node does have a state object
   * @return {boolean} state enbaled or disabled
   */
  stateStorageEnabled()
  {
    return true
  }

  /**
   * will be called when all nodes are started
   */
  nodesStarted()
  {
    var self = this

    super.nodesStarted()

    // after all nodes are started we are trying to load the last state of the node
    this.loadLastState(true)

    // the node has to be aware of new clients so it may send its current state to it
    this.habitat().on("clientConnected", function(_clientInfo){
      self.habitat().sendNodeStateToClients(self)
    })

    // the node has to be aware when a client wants to update the state of the node
    this.habitat().on("receivedDataFromClient", function(_clientInfo, _habitatEnvelope){
      // only process messages which are designated to be for the current node
      if(_habitatEnvelope.nodeId === self.getNodeId())
      {
        if(_habitatEnvelope.type.toUpperCase() == "NODESTATE")
        {
          // we have to store the originator of the state message we got, this is usefull to send when we do update
          // the other clients so the client sent knows its data came from himself
          self.stateOriginator = self.copyObject(_habitatEnvelope.originator)
          // set the state which is given by the gateway
          self.logDebug("Received node state from " + _habitatEnvelope.sender)
          self.setState(_habitatEnvelope.data, false)
        }
      }
    })
  }


  /**
   * will be called when node was created
   */
  created()
  {
  }

  /**
   * will be called when node is closing
   */
  close()
  {
    super.close()
    // be sure we are saving the current state when the node is going to be destroyed
    this.saveLastState()
  }

   /**
   * will be called when the state object has changed
   * there is no oserver on the state object, it has to be done manually!
   */
  stateUpdated()
  {
    super.stateUpdated()
    this.habitat().sendNodeStateToClients(this)
  }


  /**
   * returns true if a scene is loaded for the thing
   */
  isSceneActive()
  {
    return this.sceneId == "" ? false : true
  }


  /**
   * applies the scene (the scene state) to the thing state
   */
  applyScene(_sceneId)
  {
    var self = this
    var stateToApply = {}
    var oldSceneId  = self.sceneId

    return new Promise((_resolve, _reject) => {
      try
      {
        // save the current state to the last state (this will only be done if there is no scene loaded)
        self.saveLastState()

        // get the scene data from the scene manager, if there is no scene data we stay at the current scene
        // of the current state
        if(_sceneId)
        {
          stateToApply = self.habitat().getSceneManager().getSceneData(_sceneId, self.getNodeId())
          if(stateToApply)
          {
            // the scene id has to be set before call of 'setSate' otherwise the setStat will trigger a save of the new values to the
            // default values, what we do not want in this case!
            self.sceneId = _sceneId
            self.setState(stateToApply).then(function(){
                self.logDebug("Scene '" + _sceneId + "' for thing '" + self.getNodeId() + "' applied!")
                _resolve()
            }).catch(function(_exception){
              self.logError("Error applying state: " + _exception.toString(), _state)
              self.sceneId = oldSceneId
              _reject()
            })
          }
          // there is no such scene for the thing in the scene storage, so we do nothing
          // but thats okay, we do only give some warning
          else
          {
            self.logWarning("Scene '" + _sceneId + "' for thing '" + self.getNodeId() + "' not found! Let's keep current state values!")
            _resolve()
          }

        }
        // if no sceneid is given, we load the last state without any scene
        else
        {
          self.sceneId = ""
          self.loadLastState()
          self.logDebug("Original state for '" + self.getNodeId() + "' loaded")
          _resolve()
        }
      }
      catch(_exception)
      {
        self.logError(_exception.toString())
        _reject(_exception)
      }
    })






      /*
      this.setState(sceneState)

      this.applyState(sceneState).then(function(_dispatchState = true){
        // when the state was applied, we have to call 'stateUpdated' which will deliver the data to all clients
        // this may lead to multiple sending of a state when using KNX-Thing nodes with feddback ga's (due that feedback ga's will trigger 'stateUpdated') as well
        // so we do have the '_dispatchState' var for denying sending of a status
        if(_dispatchState)
          self.stateUpdated()
      }).catch(function(_exception){
        self.logError("Error applying state: " + _exception.toString(), _state)
      })
      */

  }

}

module.exports = Habitat_Node_Thing