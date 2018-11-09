
"use strict"

const Habitat_Node  = require('../habitat-node.js')


class Habitat_Node_Thing extends Habitat_Node
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
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
  stateEnabled()
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
          // set the state which is given by the gateway
          self.logDebug("Received node state from " + _habitatEnvelope.sender)
          self.setState(_habitatEnvelope.data, false)
        }
      }
    })
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

}

module.exports = Habitat_Node_Thing