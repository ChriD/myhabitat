



module.exports = function(RED)
{

  "use strict"

  const Habitat_Node_Common  = require("./habitat-node.common.js")


  class Habitat_Node_Common_Selector extends Habitat_Node_Common
  {
    constructor(_config)
    {
      super(RED, _config)

      var self = this

      // a selector does hve an index which represents the current selection
      self.selectedIdx  = -1
      self.maxIdx       = _config.rows.length - 1

      RED.nodes.createNode(self, _config)

      // we have to call the created event for some stuff which will be done in the base class
      // this is a 'have to'!
      self.created()


      self.on('input', function(_msg) {
        var value = _msg.payload

        switch(typeof value)
        {
          // if we get a number we do interpret it as ON/OFF value (0=OFF / >0=ON)
          case "number":
            if(value > 0)
              self.selectionUp()
            else if(value < 0)
              self.selectionDown()
            break

          // if we get a boolean we do interpret it as ON/OFF value
          case "boolean":
            if(value)
              self.selectionUp()
            else
              self.selectionDown()
            break

          // if we get a string it may be a predefined action or a scene identifier
          // predefined actions are : "TOGGLE"
          case "string":
            if(value.toUpperCase() == "UP")
              self.selectionUp()
            else if(value.toUpperCase() == "DOWN")
              self.selectionDown()
            else if(value.toUpperCase() == "RESET")
              self.reset()
            break

          // if the input is an object, we assume that it is a "habitat multi purpose object"
          // a multi purpose object has a type which let's us know what the data is for
          case "object":
            break

          // give some warning if we do not have any valid input
          default:
            self.logWarning("Wrong input type for " + self.getNodeId())
            break
        }
      });

    }

    reset()
    {
      this.selectedIdx = -1
      this.updateNodeInfoState()
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
      var self = this;
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
      self.updateNodeInfoState()
    }


    updateNodeInfoState()
      {
        super.updateNodeInfoState()
        let infoText = this.selectedIdx.toString() + " -> " + (this.selectedIdx >= 0 ? this.config.rows[this.selectedIdx].v.toString() : "")
        this.status({text: infoText})
      }
  }

  RED.nodes.registerType("habitat-node-common-selector", Habitat_Node_Common_Selector)
}
