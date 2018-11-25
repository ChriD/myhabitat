/**
 *
 */
module.exports = function(RED) {

    "use strict"

    const Habitat_Node_Thing_KNX = require('./habitat-node.thing.knx.js')

    class Habitat_Node_Thing_KNX_Blind extends Habitat_Node_Thing_KNX
    {
      constructor(_config)
      {
        super(RED, _config)

        var self = this

        // the state object of the blind
        self.state = {
          blindPosition : 0,
          blindDegree   : 0
        }

        // TODO: @@@
        self.config.adapterId   = "KNX_01"

        RED.nodes.createNode(self, _config)

        // we have to call the created event for some stuff which will be done in the base class
        // this is a 'have to'!
        self.created()

        // add the group addresses which will deliver the status for the blind state (positions)
        // those datapoints will call the "feedbackDatapointChanged" method if their value has been changed!
        self.addFeedbackDatapoint(self.config.gaFeedbackBlindPosition, "DPT5.001")
        self.addFeedbackDatapoint(self.config.gaFeedbackBlindDegree, "DPT5.001")

        //
        self.on('input', function(_msg) {
          var value = _msg.payload
          switch(typeof value)
          {
            // position of the shutter in % (0 .. 100)
            case "number":
              value = value > 100 ? 100 : value
              value = value < 0   ? 0   : value
              break
          }
        });
      }


      /**
       * applyState
       */
      applyState(_newState)
      {
        var self = this
        var proms = new Array()

        return new Promise((_resolve, _reject) => {

          try
          {
            // when we got a new state we have to update the blind position
            // TODO: be sure we do only update if the state origin comes from an external source
            self.setPosition(_newState.blindPosition)
            // do not combine the new state value we got because it should be updated via the KNX State GA's
            // TODO: @@@ we may update the state if we do not have any feedbakc ga's defined?!
            //self.state = self.combineStates(_newState, self.state)
            self.updateNodeInfoState()
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
      stateEnabled()
      {
        // do we need a state? Yes i think so, but we maybe do not need to save it or we do not need apply here!
        return false
      }


      /**
       * is called whenever a value of a registered feedback datapoint is changing
       * @param {String} _ga ga which value has changed
       * @param {anytype} _oldValue old value of the ga
       * @param {anytype} _value new value of the ga
       */
      feedbackDatapointChanged(_ga, _oldValue, _value)
      {
        if(_ga == this.config.gaFeedbackBlindPosition)
          this.state.blindPosition =_value
        if(_ga == this.config.gaFeedbackBlindDegree)
          this.state.blindDegree = _value

        // the state has updated, so we have to update the node appearanec in the node-red gui and we have
        // to tell the habitat app thet tha state of this thing has changed
        this.updateNodeInfoState()
        this.stateUpdated()
      }



      setPosition(_position)
      {
        this.getKnxAdapter().sendToKNX(this.config.gaActionBlindPosition, 'DPT5.001', _position)
      }


      updateNodeInfoState()
      {
        let infoText = "Pos.:" + (this.state.blindPosition).toString() + "% / Deg.: " + (this.state.blindDegree).toString() + "%"
        let infoFill = this.state.blindPosition ? "green" : "red"
        this.status({fill:infoFill, shape:"dot", text: infoText})
      }


    }


    RED.nodes.registerType("habitat-node-thing-knx-blind", Habitat_Node_Thing_KNX_Blind)
  }
