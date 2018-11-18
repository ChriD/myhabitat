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


        RED.nodes.createNode(self, _config)

        // we have to call the created event for some stuff which will be done in the base class
        // this is a 'have to'!
        self.created()
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
       * returns the knx adapter node
       * @param {string} _source the knx device id/address
       * @param {string} _destination the knx group address
       * @param {string} _value the value of the message
       * @param {Object} _valueObject the knx object value
       */
      knxDataReceived(_source, _destination, _value, _valueObject)
      {

        // TODO:
        /*
          setPosition
          setDegree
          up
          down

          get status from status GA's (position degree)
        */

        //if(_destination == this.config.ga)
        this.send({payload :_value })
      }
    }


    RED.nodes.registerType("habitat-node-thing-knx-blind", Habitat_Node_Thing_KNX_Blind)
  }
