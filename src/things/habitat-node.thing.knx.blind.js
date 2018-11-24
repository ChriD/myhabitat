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

        // add the group address we have to listen for on the bus, those are our status GA's
        self.groupAddressFilter.push(self.config.gaFeedbackBlindPosition)
        self.groupAddressFilter.push(self.config.gaFeedbackBlindDegree)

        self.on('input', function(_msg) {
          var value = _msg.payload
          switch(typeof value)
          {
            // position of the shutter in % (0 .. 100)
            case "number":
              value = value > 100 ? 100 : value
              value = value < 0 ? 0 : value

              break
          }
        });
      }

      restoreState(_newState)
      {
        var self = this
        super.restoreState()

        // when restoring the last state from a blackout (we do not know if blackout was by loss of power supply or by redeploying the objects)
        // we should retrieve all feedback objects associated with the knx device
        // TODO: Do this in base class?
        return new Promise((_resolve, _reject) => {
          try
          {
            // TODO: get all feedback ga's
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
            self.updateInfoStatus()
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


      setPosition(_position)
      {
        this.getKnxAdapter().sendToKNX(this.config.gaActionBlindPosition, 'DPT5.001', _position)
      }


      /**
       * is called when knx data wa sreceived
       * @param {string} _source the knx device id/address
       * @param {string} _destination the knx group address
       * @param {string} _value the value of the message
       * @param {Object} _valueObject the knx object value
       */
      knxDataReceived(_source, _destination, _value, _valueObject)
      {
        // the blind may have some status objects, those one we have to listen for and we will run
        // into this method if thise ga's are present
        if(this.config.gaFeedbackBlindPosition)
          this.state.blindPosition = _value
        if(this.config.gaFeedbackBlindDegree)
          this.state.blindDegree = _value

        // TODO:
        /*
          setPosition
          setDegree
          up
          down

          get status from status GA's (position degree)
        */

        //if(_destination == this.config.ga)
        //this.send({payload :_value })
        self.updateInfoStatus()
      }


      updateInfoStatus()
      {
        let infoText = "Pos.:" (this.state.blindPosition).toString() + "% / Deg.: " + (this.state.blindDegree).toString()
        let infoFill = this.state.blindPosition ? "green" : "red"
        this.status({fill:infoFill, shape:"dot", text: infoText})
      }


    }


    RED.nodes.registerType("habitat-node-thing-knx-blind", Habitat_Node_Thing_KNX_Blind)
  }
