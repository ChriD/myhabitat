
"use strict"

const Habitat_Node_Thing  = require('./habitat-node.thing.js')


class Habitat_Node_Thing_KNX extends Habitat_Node_Thing
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
    this.groupAddressFilter = []
  }

  /**
   * returns the type of the thing
   * @return {string}
   */
  getThingType()
  {
    return "KNX"
  }


   /**
   * returns the type of the thing
   * @return {string}
   */
  getKnxAdapterId()
  {
    if(this.config.adapterId)
      return this.config.adapterId
    return "KNX_01"
  }


  /**
   * returns the knx adapter node
   * @return {Object}
   */
  getKnxAdapter()
  {
    return this.adapters()[this.getKnxAdapterId()]
  }


  /**
   * will be called when all nodes are started
   */
  nodesStarted()
  {
    var self = this
    super.nodesStarted()

    // the node has to be aware when a client wants to update the state of the node
    self.getKnxAdapter().on("gaReceived", function(_source, _destination, _value, _valueObject){
      // only listen to GA's defined in the group address filter list
      if(self.groupAddressFilter.includes(_destination))
        self.knxDataReceived(_source, _destination, _value, _valueObject)
    })
  }



  /**
   * returns the knx adapter node
   * @param {string} _source
   * @param {string} _destination
   * @param {string} _value
   * @param {Object} _valueObject
   */
  knxDataReceived(_source, _destination, _value, _valueObject)
  {
  }


}

module.exports = Habitat_Node_Thing_KNX