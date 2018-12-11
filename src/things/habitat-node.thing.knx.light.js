/**
 *
 */
module.exports = function(RED) {

    "use strict"

    const Habitat_Node_Thing_KNX = require('./habitat-node.thing.knx.js')

    class Habitat_Node_Thing_KNX_Light extends Habitat_Node_Thing_KNX
    {
      constructor(_config)
      {
        super(RED, _config)

        var self = this

        // the state object of the blind
        self.state = {
          'isOn'    : false,
          'brightness' : 1.0,
         }

        RED.nodes.createNode(self, _config)


        // we have to call the created event for some stuff which will be done in the base class
        // this is a 'have to'!
        self.created()

        // add the group addresses which will deliver the status for the blind state (positions)
        // those datapoints will call the "feedbackDatapointChanged" method if their value has been changed!
        // TODO: @@@

        //
        self.on('input', function(_msg) {
          // TODO: @@@
        })

      }


      /**
       * applyState
       */
      applyState(_newState)
      {
        var self = this
        return new Promise((_resolve, _reject) => {
          try
          {
            // TODO: @@@
            _resolve()
          }
          catch(_exception)
          {
            self.logError(_exception.toString())
            _reject(_exception)
          }
        })
      }


      /**
       * should return true if the node does have a state object
       * @return {boolean} state enbaled or disabled
       */
      stateStorageEnabled()
      {
        return false
      }


      /**
       * is called whenever a value of a registered feedback datapoint was changed
       * @param {String} _ga ga which value has changed
       * @param {anytype} _oldValue old value of the ga
       * @param {anytype} _value new value of the ga
       */
      feedbackDatapointChanged(_ga, _oldValue, _value)
      {
        // the state has updated, so we have to update the node appearanec in the node-red gui and we have
        // to tell the habitat app thet tha state of this thing has changed
        this.stateUpdated()
      }


       /**
       * should be called when the appearnce of the node in the node-red gui has to be updates
       * in this case we do show the current position of the blind (position + degree)
       */
      updateNodeInfoState()
      {
        super.updateNodeInfoState();
        //let infoText = "Pos.:" + (this.state.blindPosition).toString() + "% / Deg.: " + (this.state.blindDegree).toString() + "%"
        //let infoFill = this.state.blindPosition ? "green" : "red"
        //this.status({fill:infoFill, shape:"dot", text: infoText})
      }


    }


    RED.nodes.registerType("habitat-node-thing-knx-light", Habitat_Node_Thing_KNX_Light)
  }
