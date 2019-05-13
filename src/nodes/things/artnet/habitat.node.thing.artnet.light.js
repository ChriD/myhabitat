"use strict"

const HabitatNode_Thing_ARTNET   = require('./habitat.node.thing.artnet.js')


module.exports = function(RED) {

  class HabitatNode_Thing_ARTNET_Light extends HabitatNode_Thing_ARTNET
  {
    constructor(_config)
    {
      super(RED, _config)

      RED.nodes.createNode(this, _config)

      this.created()
    }



    getDefaultState()
    {
      return  {
                isOn        : false,
                brightness  : 100,
                color       : {
                                white       : 127,
                                warmwhite   : 127,
                                red         : 127,
                                green       : 127,
                                blue        : 127
                              }
              }
    }


    input(_message)
    {
      const payload = _message.payload

      // be sure we always have a state object for further processing
      if(!_message.state)
        _message.state = {}

      switch(typeof payload)
      {
        // a number is representating a brightness value
        case "number" :
          _message.state.brightness = payload
          break
        // a boolean tells us if the lamp should be on or off
        case "boolean":
          _message.state.isOn = payload === true ? true : false
          break
        // and we may have some special actions which are representated as strings
        case "string":
          if(payload.toUpperCase() === "TOGGLE")
          _message.state.isOn = this.state().isOn ? false : true
          break
      }

      // apply the state object which was given by the input or which was created from
      // the above code to the physical device
      if(_message.state)
      {
        if(_message.state.isOn)
          this.turnOn()
        if(!_message.state.isOn)
          this.turnOff()
        if(_message.state.brightness && this.isDimmable())
          this.setBrightness(_message.state.brightness / 100 * 255)
      }

      this.updateNodeInfoStatus()

    }


    isDimmable()
    {
      return this.config.lightType === "SIMPLEDIM" ? true : false
    }


    turnOn()
    {
    }


    turnOff()
    {
    }


    setBrightness(_brightness)
    {
    }


    updateNodeInfoStatus()
    {
      super.updateNodeInfoStatus()
      let infoText = Math.round((this.state().brightness)).toString() + "%"
      let infoFill = this.state().isOn ? "green" : "red"
      this.status({fill:infoFill, shape:"dot", text: infoText})
    }


  }

  RED.nodes.registerType('habitat-thing-artnet-light', HabitatNode_Thing_ARTNET_Light)

}
