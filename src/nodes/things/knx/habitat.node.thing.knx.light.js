"use strict"

const HabitatNode_Thing_KNX   = require('./habitat.node.thing.knx.js')


module.exports = function(RED) {

  class HabitatNode_Thing_KNX_Light extends HabitatNode_Thing_KNX
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
        if(_message.state.isOn /*&& _message.state.isOn != this.state().isOn*/)
          this.turnOn()
        if(!_message.state.isOn /*&& _message.state.isOn != this.state().isOn*/)
          this.turnOff()
        if(_message.state.brightness /*&& _message.state.brightness != this.state().brightness*/ && this.isDimmable())
          this.setBrightness(_message.state.brightness / 100 * 255)
      }

    }


    ready()
    {
      super.ready()

      // register the feedback GA's for the state of the light
      if(this.config.gaFeedbackOnOff)
        this.observeGA(this.config.gaFeedbackOnOff, 'DPT1.001')
      if(this.config.gaFeedbackBrightness && this.isDimmable())
        this.observeGA(this.config.gaFeedbackBrightness, 'DPT5.001')
    }

    isDimmable()
    {
      return this.config.lightType === "SIMPLEDIM" ? true : false
    }


    gaReceived(_ga, _value, _data)
    {
      super.gaReceived(_ga, _value)

      // if we have received a feedback ga, we have to set the appropriate state
      switch(_ga)
      {
        case this.config.gaFeedbackOnOff:
          this.state().isOn = _value
          break
        case this.config.gaFeedbackBrightness:
          this.state().brightness = (100 / 255) * _value
          break
      }

      this.updateNodeInfoStatus()
    }


    turnOn()
    {
      this.sendGA(this.config.gaActionOnOff, 'DPT1.001', 1)
    }


    turnOff()
    {
      this.sendGA(this.config.gaActionOnOff, 'DPT1.001', 0)
    }


    setBrightness(_brightness)
    {
      //this.sendGA(this.config.gaActionOnOff, 'DPT5.001', _brightness)
    }


    updateNodeInfoStatus()
    {
      super.updateNodeInfoStatus()
      let infoText = Math.round((this.state().brightness)).toString() + "%"
      let infoFill = this.state().isOn ? "green" : "red"
      this.status({fill:infoFill, shape:"dot", text: infoText})
    }

  }


  RED.nodes.registerType('habitat-thing-knx-light', HabitatNode_Thing_KNX_Light)

}
