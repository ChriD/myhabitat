
"use strict"

const Habitat_Node_Thing  = require('./habitat-node.thing.js')


class Habitat_Node_Thing_Artnet extends Habitat_Node_Thing
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
  }

  /**
   * returns the type of the thing
   * @return {string}
   */
  getThingType()
  {
    return "ARTNET"
  }


  /**
   * returns the type of the thing
   * @return {string}
   */
  getArtnetAdapterId()
  {
    if(this.config.adapterId)
      return this.config.adapterId
    return "ARTNET_01"
  }

  /**
   * returns the artnet adapter node
   * @return {Object}
   */
  getArtnetAdapter()
  {
    return this.adapters()[this.getArtnetAdapterId()]
  }


}

module.exports = Habitat_Node_Thing_Artnet