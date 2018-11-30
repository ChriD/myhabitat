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

        // the last state set by a gui or by a node-red flow
        self.lastStateSet = {
          blindPosition : 0,
          blindDegree   : 0
        }

        self.isPositioningMode = false
        self.intervalPositioning = 0
        self.IntervalPositioningInterval = 1000
        self.intervalPositioningMS = 0

        RED.nodes.createNode(self, _config)


        // we have to call the created event for some stuff which will be done in the base class
        // this is a 'have to'!
        self.created()

        // add the group addresses which will deliver the status for the blind state (positions)
        // those datapoints will call the "feedbackDatapointChanged" method if their value has been changed!
        self.dpBlindPos = self.addFeedbackDatapoint(self.config.gaFeedbackBlindPosition, "DPT5.001")
        self.dpBlindDeg = self.addFeedbackDatapoint(self.config.gaFeedbackBlindDegree, "DPT5.001")

        //
        self.on('input', function(_msg) {
          var value     = _msg.payload
          var newState  = self.copyObject(self.state)
          switch(typeof value)
          {
            // position of the shutter in % (0 .. 100)
            case "number":
              value = value > 100 ? 100 : value
              value = value < 0   ? 0   : value
              newState.blindPosition = value
              break
          }

          self.applyState(newState)
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
            // we have to store the last state which was set by a user or node interaction (not by a feedback ga)
            // this state will hold the position we are want to drive the blind to. Thi will also inclue seting position and
            // afterwards only setting the degree. Precondition for that is, that only the state items which are beeign set are sent
            self.lastStateSet = this.combineStates(_newState, self.lastStateSet)

            // when we got a new state we have to update the blind position
            // the apply state will only be called when the state was changed by a client or by a scene (loaded state)
            self.setBlindPosition(self.lastStateSet.blindPosition, self.lastStateSet.blindDegree).then(function(){
              _resolve()
            }).catch(function(_exception){
              _reject(_exception)
            })
            // INFO: we do not combine the new state we got because it should be updated via the KNX State GA's
            // we may update the state if we do not have any feedback ga's defined?!
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
        // TODO: rename method to??? allowStateSave???
        // do we need a state? Yes i think so, but we maybe do not need to save it or we do not need apply here!
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
        if(_ga == this.config.gaFeedbackBlindPosition)
          this.state.blindPosition =_value
        if(_ga == this.config.gaFeedbackBlindDegree)
          this.state.blindDegree = _value

        // if we are not in positioning mode by ourselfs, we may update the 'lastStateSet' with the current info
        // this is the case when soem other application is moving the blinds qithout habitat knowing of it.
        // in fact this is not best practice but we keep the node able to handle that in a proper way
        this.lastStateSet = this.copyObject(this.state)

        // the state has updated, so we have to update the node appearanec in the node-red gui and we have
        // to tell the habitat app thet tha state of this thing has changed
        this.updateNodeInfoState()
        this.stateUpdated()
      }


      setBlindPosition(_position, _degree)
      {
        var self = this
        return new Promise((_resolve, _reject) => {
          self.isPositioningMode = true
          self.setPosition(_position).then(function(){
            // after we have reached the position, we do have to set the degree value
            self.setDegree(_degree).then(function(){
              self.isPositioningMode = false
              _resolve()
            }).catch(function(_exception){
              self.isPositioningMode = false
              _reject(_exception)
            })
          }).catch(function(_exception){
            self.isPositioningMode = false
            _reject(_exception)
          })
        })
      }


      setPosition(_position)
      {
        var self = this
        var posDifference = Math.abs(self.state.blindPosition - _position)

        return new Promise((_resolve, _reject) => {

          // be sure we skip and give an error if there is no instance found we can use!
          if(!self.hasValidAdapter())
          {
            _reject(new Error("No valid adapter!"))
            return
          }

          // we have update the kny bus with the ga given for the blind absolute positioning
          self.getKnxAdapter().sendToKNX(self.config.gaActionBlindPosition, 'DPT5.001', _position)
          // after we have send the GA with its value to the bus, the blind should change it's position
          // and then when it has reached it's position we should update the blind degree (may be not done by the actor itself)
          // for this we are starting an intervall which will request the current position of the shutter
          if(self.intervalPositioning)
          {
            clearInterval(self.intervalPositioning)
            self.intervalPositioningMS = 0
          }
          // we can not be sure that the feedback objects do well (eg. case of Grieser MGX09 won't delievery the last state of the position)
          // for that we do force reading the status until we are reaching the value or we are running into a timeout (if blind doesn't move)
          self.intervalPositioning = setInterval(function(){
            self.intervalPositioningMS += self.IntervalPositioningInterval
            if(self.state.blindPosition === _position)
            {
              clearInterval(self.intervalPositioning)
              self.intervalPositioningMS = 0
              _resolve()
            }
            self.dpBlindPos.read()
            // if we reach a timout, then we do a reject
            // TODO: currently the toimeout is set to 30 seconds, we may change the timout value regarding the posDifference
            if(self.intervalPositioningMS > 30000)
            {
              clearInterval(self.intervalPositioning)
              _reject(new Error("setPosition timout reached!"))
            }
          },  self.IntervalPositioningInterval)
        })
      }



      setDegree(_degree)
      {
        var self = this

        return new Promise((_resolve, _reject) => {

          // be sure we skip and give an error if there is no instance found we can use!
          if(!self.hasValidAdapter())
          {
            _reject(new Error("No valid adapter!"))
            return
          }

          self.getKnxAdapter().sendToKNX(self.config.gaActionBlindDegree, 'DPT5.001', _degree)
          // be sure we do only wait for the last given position call, calls made prior will be dismissed
          if(self.intervalPositioning)
          {
            clearInterval(self.intervalPositioning)
            self.intervalPositioningMS = 0
          }
          self.intervalPositioning = setInterval(function(){
            self.intervalPositioningMS +=  self.IntervalPositioningInterval
            if(self.state.blindDegree === _degree)
            {
              clearInterval(self.intervalPositioning)
              self.intervalPositioningMS = 0
              _resolve()
            }
            self.dpBlindDeg.read()
            if(self.intervalPositioningMS > 5000)
            {
              clearInterval(self.intervalPositioning)
              _reject(new Error("setDegree timout reached!"))
            }
          },  self.IntervalPositioningInterval)
        })
      }




       /**
       * should be called when the appearnce of the node in the node-red gui has to be updates
       * in this case we do show the current position of the blind (position + degree)
       */
      updateNodeInfoState()
      {
        let infoText = "Pos.:" + (this.state.blindPosition).toString() + "% / Deg.: " + (this.state.blindDegree).toString() + "%"
        let infoFill = this.state.blindPosition ? "green" : "red"
        this.status({fill:infoFill, shape:"dot", text: infoText})
      }


    }


    RED.nodes.registerType("habitat-node-thing-knx-blind", Habitat_Node_Thing_KNX_Blind)
  }
