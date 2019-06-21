
"use strict"

const MyHabitatNode  = require('../myhabitat.node.js')

module.exports = function(RED) {

  class MyHabitatNode_Common_Selector extends MyHabitatNode
  {
    constructor(_config)
    {
      super(RED, _config)
      RED.nodes.createNode(this, _config)

      this.selectedIdx  = -1
      this.maxIdx       = _config.rows.length - 1

      this.created()
    }


    input(_message)
    {
      const self = this

      super.input(_message)

      const payload = _message.payload

      switch(typeof payload)
      {
        case "number":
          if(payload > 0)
            self.selectionUp()
          else if(payload < 0)
            self.selectionDown()
          break

        case "boolean":
          if(payload)
            self.selectionUp()
          else
            self.selectionDown()
          break

        case "string":
          if(payload.toUpperCase() == "UP")
            self.selectionUp()
          else if(payload.toUpperCase() == "DOWN")
            self.selectionDown()
          else if(payload.toUpperCase() == "RESET")
            self.reset()
          break
        // TODO: silentDown, silentUp?

        default:
          break
      }
    }

    reset()
    {
      this.selectedIdx = -1
      this.updateNodeInfoStatus()
    }


    selectionUp(_steps = 1)
    {
      this.selectionChange(_steps)
    }


    selectionDown(_steps = 1)
    {
      this.selectionChange(_steps * -1)
    }


    selectionChange(_steps)
    {
      const self = this
      // simple version of beginning from the first index again if we do exceed the maximum index
      // this should be made better in future. for now it does its job
      while(_steps)
      {
        self.selectedIdx += _steps > 0 ? 1 : -1
        if(self.selectedIdx > self.maxIdx)
          self.selectedIdx = 0
        if(self.selectedIdx < 0)
          self.selectedIdx = self.maxIdx
        _steps += _steps > 0 ? -1 : 1
      }

      // build the output array
      var outputData = []
      for(var i=0; i<=self.maxIdx; i++)
      {
        if(i == self.selectedIdx)
          outputData.push({ payload : self.config.rows[self.selectedIdx].v })
        else
          outputData.push(null)
      }

      // trigger the output of the current selected index
      self.send(outputData)
      self.updateNodeInfoStatus()
    }


    updateNodeInfoStatus()
    {
      super.updateNodeInfoStatus()
      let infoText = this.selectedIdx.toString() + " -> " + (this.selectedIdx >= 0 ? this.config.rows[this.selectedIdx].v.toString() : "")
      this.status({text: infoText})
    }


  }
  RED.nodes.registerType("myhabitat-common-selector", MyHabitatNode_Common_Selector)
}