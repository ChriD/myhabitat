/**
 *
 */
module.exports = function(RED) {

    "use strict"

    const Habitat_Node_Thing_KNX = require('./habitat-node.thing.knx.js')

    class Habitat_Node_Thing_KNX_Plug extends Habitat_Node_Thing_KNX
    {
      constructor(_config)
      {
        super(RED, _config)

        var self = this

        // the state object of the blind
        self.state = {
          'isOn'    : false
         }

        RED.nodes.createNode(self, _config)

        // we have to call the created event for some stuff which will be done in the base class
        // this is a 'have to'!
        self.created()

        // add the group addresses which will deliver the status for the blind state (positions)
        // those datapoints will call the "feedbackDatapointChanged" method if their value has been changed!
        if(self.config.gaFeedbackPlugStatus)
          self.dpPlugStatus= self.addFeedbackDatapoint(self.config.gaFeedbackPlugStatus, "DPT1.001")

        // TODO:  0 = OFF / 1 = ON
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
            if(_newState.isOn)
              self.turnOn()
            else
              self.turnOff()
            // we do not allow the resolve to call 'updateState' if we do have a feedback GA (the feedback ga will do it for us)
            _resolve(self.config.gaFeedbackPlugStatus ? false : true)
          }
          catch(_exception)
          {
            self.logError(_exception.toString())
            _reject(_exception)
          }
        })
      }


      turnOn()
      {
        this.getKnxAdapter().sendToKNX(this.config.gaActionPlugStatus, 'DPT1.001', 1)
      }

      turnOff()
      {
        this.getKnxAdapter().sendToKNX(this.config.gaActionPlugStatus, 'DPT1.001', 0)
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
        if(_ga == this.config.gaFeedbackPlugStatus)
          this.state.isOn =_value
        // the state has updated, so we have to update the node appearance in the node-red gui and we have
        // to tell the habitat app thet thaz state of this thing has changed
        this.stateUpdated()
      }


       /**
       * should be called when the appearnce of the node in the node-red gui has to be updates
       * in this case we do show the current position of the blind (position + degree)
       */
      updateNodeInfoState()
      {
        super.updateNodeInfoState();
        let infoText = this.state.isOn ? "EIN" : "AUS"
        let infoFill = this.state.isOn ? "green" : "red"
        this.status({fill:infoFill, shape:"dot", text: infoText})
      }


    }


    RED.nodes.registerType("habitat-node-thing-knx-plug", Habitat_Node_Thing_KNX_Plug)
  }
