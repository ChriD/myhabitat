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
                brightness  : 1.0,
              }
    }


    input(_message)
    {
      // Input can come from the socket adapter or from node-red gui
      // TODO: @@@
    }


    ready()
    {
      super.ready()

      // register the feedback GA's for the light
      this.observeGA(this.config.gaFeedbackOnOff, 'DPT1.001')
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
      }
    }


    turnOn()
    {
      this.sendGA(this.config.gaActionOnOff, 'DPT1.001', 1)
    }


    turnOff()
    {
      this.sendGA(this.config.gaActionOnOff, 'DPT1.001', 0)
    }


  }


  RED.nodes.registerType('habitat-thing-knx-light', HabitatNode_Thing_KNX_Light)

}
