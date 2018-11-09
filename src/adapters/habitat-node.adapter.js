
"use strict"

const Habitat_Node  = require('../habitat-node.js')


class Habitat_Node_Adapter extends Habitat_Node
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
  }


  /**
   * should return a unique persistant id of the adapter instance
   * @return {string}
   */
  getAdapterId()
  {
    return this.config.adapterId
  }

  /**
   * should return the type of the adapter
   * has to be overwritten!
   * @return {string}
   */
  getAdapterType()
  {
    return ""
  }

  /**
  * should return a unique persistant id of the node
  * @return {string}
  */
 getNodeId()
 {
   return this.getAdapterId()
 }

   /**
   * returns the prefix for the logs. should be overwritten
   * @return {String} the prefix for every log
   */
  getLogPrefix()
  {
    return "[" + this.getAdapterType() + "] " + this.getAdapterId() + ":"
  }


   /**
   * will be called after the createNode of the RED application
   */
  created()
  {
    // be sure to trigger the codes that are running in the base class
    super.created()

    // create the adapter object array in the global context if its not already created
    if(!this.adapters())
      this.context().global.set(this.getHabitatAdaptersGlobalContextId(), [])

    // get the adapter array from the global context and register the new created adapter
    var adapters = this.adapters()
    adapters[this.getAdapterId()] = this
    this.logInfo("Adapter [" + this.getAdapterType() + "] " + this.getAdapterId() + " was registered")
  }


  /**
   * will be called when node is closing
   */
  close()
  {
    var adapters = this.adapters()
    if(adapters)
    {
      adapters[this.getAdapterId()] = null
      this.logInfo("Adapter [" + this.getAdapterType() + "] " + this.getAdapterId() + " was unregistered")
    }
  }

}

module.exports = Habitat_Node_Adapter