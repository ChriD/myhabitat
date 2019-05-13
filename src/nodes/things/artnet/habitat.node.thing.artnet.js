"use strict"

const HabitatNode_Thing   = require('../../habitat.node.thing.js')

class HabitatNode_Thing_ARTNET extends HabitatNode_Thing
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
  }


  getEntityModuleId()
  {
    return "ARTNET"
  }


  artnetSet(_channel, _value)
  {
    this.adapterNode().artnetSet(_channel, _value)
  }


  artnetFade(_channel, _value, _fadeTime)
  {
    this.adapterNode().artnetFade(_channel, _value, _fadeTime)
  }


}


module.exports = HabitatNode_Thing_ARTNET