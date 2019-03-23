



module.exports = function(RED) {

  "use strict"

  const Habitat_Node_Common  = require("./habitat-node.common.js")


  class Habitat_Node_Common_Selector extends Habitat_Node_Common
  {
    constructor(_RED, _config)
    {
      super(_RED, _config)

      var self = this

      // a selector does hve an index which represents the current selection
      self.selectedIdx = 0

      _RED.nodes.createNode(self, _config)

      // we have to call the created event for some stuff which will be done in the base class
      // this is a 'have to'!
      self.created()


      self.on('input', function(_msg) {
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
            break

          // if the input is an object, we assume that it is a "habitat multi purpose object"
          // a multi purpose object has a type which let's us know what the data is for
          case "object":
            break

          // give some warning if we do not have any valid input
          default:
            self.logWarning("Wrong input type for " + self.getNodeId())
            updateState = false
            break
        }
      });

    }


    selectionUp(_steps = 1)
    {
    }


    selectionDown(_steps = 1)
    {
    }
  }

  RED.nodes.registerType("habitat-node-common-selector", Habitat_Node_Common_Selector)
}
