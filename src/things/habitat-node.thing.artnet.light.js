

// HSV????

/**
 *
 */
module.exports = function(RED) {

    "use strict"

    const Habitat_Node_Thing_Artnet  = require('./habitat-node.thing.artnet.js')

    class Habitat_Node_Thing_Artnet_Light extends Habitat_Node_Thing_Artnet
    {
      constructor(_config)
      {
        super(RED, _config)

        var self = this

        // INFO: The brightness value on the state will not change on "on / off"
        self.state = {
          'isOn'    : false,
          'color' : {
                      'white'     : 127,
                      'warmwhite' : 127,
                      'red'       : 127,
                      'green'     : 127,
                      'blue'      : 127
                    },
           'brightness' : 1.0,
         }

        // timer id which will be > 0 when fading is currently running
        self.fadingTimerId = 0

        // intervall id for dimming to a specific brightness
        self.brightnessIntervallId = 0

        // TODO: @@@
        this.config.adapterId   = "ARTNET_01"
        this.config.dimFadeDuration   = 254
        this.config.colorFadeDuration = 254

        RED.nodes.createNode(self, _config)

        // we have to call the created event for some stuff which will be done in the base class
        // this is a 'have to'!
        self.created()

        // TODO: when all nodes are loaded then subscribe to the event handlers of the gateways.
        // this will be done in the base class and the base class will filter out the related maessages for the thing

        // TODO: attach the handler for the input wires (after all nodes are loaded)
        self.on('input', function(_msg) {
            var value = _msg.payload
            switch(typeof value)
            {
              // '1' turn on, '0' turn off
              case "number":
                if(value == 0)
                  self.turnOff()
                else
                  self.turnOn()
                break
              // 'true' turn on, 'false' turn off
              case "boolean":
                if(!value)
                  self.turnOff()
                else
                  self.turnOn()
                break
              // a string should be a scene identifier. a scene is stored with its name to a state file, so we can use
              // the name directly and load the 'scene' (state)
              case "string":
                self.loadState(value)
                break
              // an object should be a "state" object
              // this will be merged and applied to the current state object
              case "object":
                var newState = copyObject(this.state)
                newState = self.combineStates(newState, value)
                self.setState(newState, false)
                break
              default:
                self.logWarning("Wrong input type for " + self.getThingId())
            }
        });
      }


      /**
       * restoreState
       */
      restoreState(_newState)
      {
        var self = this
        super.restoreState()

        // when restoring the last state from a blackout (we do not know if blackout was by loss of power supply or by redeploying the objects)
        // we directly force the values to the artnet object. There is no fading or dimming because we do not know the 'real' old artnet values here
        self.state = self.copyObject(_newState)
        return self.applyState(_newState)
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
            if(_newState.isOn && !self.state.isOn)
              proms.push(self.turnOn())
            else if(!_newState.isOn && self.state.isOn)
              proms.push(self.turnOff())
            // when the on/off state of the lamp is is not changeing we can dim to brightness and fade to color
            else
            {
              proms.push(self.dimTo(_newState.brightness))
              proms.push(self.fadeTo(_newState.color))
            }

            // if all the fading and dimming is done we do store/commit the new state as the last state
            // we do not want to have a state saved when it's in dimming or fading mode
            Promise.all(proms).then(function(){
              // be sure we do set the whole loaded state to the current state
              self.state = self.copyObject(_newState)
              self.saveLastState()
              _resolve()
            }).catch(function(_exception){
              _reject(_exception)
            })
          }
          catch(_exception)
          {
            self.logError(_exception.toString())
            _reject(_exception)
          }

        })

      }



      sendToArtnet(_color = this.state.color, _brightness = this.state.brightness, _isOn = this.state.isOn)
      {
        // TODO: build artnet value array from the color object and the brightness
        this.normalizeColorObject(_color)
        this.getArtnetAdapter().sendToArtnet(this.config.channel, [
                                                                    Math.round(_color.warmwhite * _brightness) * (_isOn ? 1 : 0),
                                                                    Math.round( _color.white * _brightness) * (_isOn ? 1: 0)
                                                                  ])
      }


      normalizeColorObject(_color)
      {
        if(_color.warmwhite)  _color.warmwhite  = parseInt(_color.warmwhite)
        if(_color.white)      _color.white      = parseInt(_color.white)
        if(_color.red)        _color.red        = parseInt(_color.red)
        if(_color.green)      _color.green      = parseInt(_color.green)
        if(_color.blue)       _color.blue       = parseInt(_color.blue)
      }



      /**
       * turn on the light
       */
      turnOn()
      {
        var self = this

        return new Promise(function(_resolve, _reject)
        {
          try
          {
            // in fact if the light is already on we do not have to do anything, but to be sure (in case of blackout or somehting like that)
            // we do update the values on the artnet
            if(self.state.isOn)
            {
              self.sendToArtnet()
              _resolve()
              return
            }

            // we have to set the state to 'on' before we start the dimming to the dim value, otherwise the
            // values wont be calculated in the 'sendToArtnet' method
            // Be aware that the on/off dimming will not affect the brightness value on the state
            self.state.isOn = true
            self.dimTo(self.state.brightness, 0).then(function(){
              self.stateUpdated()
              self.saveLastState()
              _resolve()
            })

          }
          catch(_exception)
          {
            _reject(_exception)
          }
        })
      }

       /**
       * turn off the light
       */
      turnOff()
      {
        var self = this

        return new Promise(function(_resolve, _reject)
        {
          try
          {
            // in fact if the light is already off we do not have to do anything, but to be sure (in case of blackout or somehting like that)
            // we do update the values on the artnet
            if(!self.state.isOn)
            {
              self.sendToArtnet()
              _resolve()
              return
            }

            // do dimming down to 0 value and then save the state
            // Be aware that the on/off dimming will not affect the brightness value on the state
            self.dimTo(0).then(function(){
              self.state.isOn = false
              self.stateUpdated()
              self.saveLastState()
              _resolve()
            })

          }
          catch(_exception)
          {
            _reject(_exception)
          }
        })
      }


      /**
       * set the current brightness
       */
      setBrightness(_brightness)
      {
        var self = this

        return new Promise(function(_resolve, _reject)
        {
          try
          {
            self.dimTo(_brightness).then(function(){
              self.state.brightness = _brightness
              self.stateUpdated()
              self.saveLastState()
              _resolve()
            })

          }
          catch(_exception)
          {
            _reject(_exception)
          }
        })
      }


       /**
       * dim to brightness
       */
      dimTo(_brightness, _fromBrightness = this.state.brightness, _duration = this.config.dimFadeDuration)
      {
        var self = this

        return new Promise(function(_resolve, _reject)
        {
          try
          {
            // be sure to kill currently running brightness changes before we start a new one
            if(self.brightnessIntervallId)
              clearInterval(self.brightnessIntervallId)

            // calculate brightness difference and step (decrease/increase) for 1ms
            var stepTime        = 1
            var brightnessDiff  = _brightness - _fromBrightness
            var brightnessStep  = brightnessDiff / (_duration / stepTime)

            if(brightnessDiff)
            {
              // set up the fading timer/interval (the timer will be set up for 1 milisecond)
              self.brightnessIntervallId = setInterval(function(){
                _fromBrightness += brightnessStep

                // be sure there is no overrun of the values
                if( (brightnessStep > 0 && _fromBrightness > _brightness) ||
                    (brightnessStep < 0 && _fromBrightness < _brightness))
                    _fromBrightness = _brightness

                // TODO: Maybe build dimming option for non linear dimming
                // levels[n] = int(pow(Pmax * ((float)n/(float)N), 1/a) + 0.5);
                // a = 0.33 -> 0.5

                self.sendToArtnet(self.state.color, _fromBrightness)
                if(_fromBrightness == _brightness)
                {
                  clearInterval(self.brightnessIntervallId)
                  _resolve()
                }
              }, stepTime)
            }
            // we also have to update the artnet if there is no difference in brightness
            // thats because we may come from a blackout and theerfore therefore is not valid state (newState = state)
            else
            {
              self.sendToArtnet(self.state.color, self.state.brightness)
              _resolve()
            }
          }
          catch(_exception)
          {
              self.logError(_exception.toString())
              _reject(_exception)
          }
        })
      }


      /**
       * fade option
       * TODO: should be made faster & better
       * fading should dim bertween the values and keep the teperature        */
      // TODO: FOR RGBW!!!
      fadeTo(_target, _duration =  this.config.colorFadeDuration)
      {
        var self = this

        return new Promise(function(_resolve, _reject)
        {
          try
          {
            var duration      = _duration
            var intervalTime  = 0
            var source        = self.state.color

            self.normalizeColorObject(source)

            // calculate the ms each color has to be updated
            var whiteDiff     = _target.white - source.white
            var warmWhiteDiff = _target.warmwhite - source.warmwhite


            // clear the current fading if we are starting a new one
            if(self.fadingTimerId)
              clearInterval(self.fadingTimerId)

            if(whiteDiff || warmWhiteDiff)
            {
              var whiteMS     = Math.abs(Math.round(duration / whiteDiff))
              var warmWhiteMS = Math.abs(Math.round(duration / warmWhiteDiff))
              if(!whiteMS && whiteDiff) whiteMS = 1
              if(!warmWhiteMS && warmWhiteDiff) warmWhiteMS = 1

              // set up the fading timer/interval (the timer will be set up for 1 milisecond)
              self.fadingTimerId = setInterval(function(){
                intervalTime += 1
                if(whiteMS && intervalTime % whiteMS == 0 && source.white != _target.white)
                  source.white += 1 * (_target.white < source.white ? -1 : 1)
                if(warmWhiteMS && intervalTime % warmWhiteMS == 0 && source.warmwhite != _target.warmwhite)
                  source.warmwhite += 1 *  (_target.warmwhite < source.warmwhite ? -1 : 1)
                // TODO: only update when something changed
                self.sendToArtnet(source)
                //self.getArtnetAdapter().sendToArtnet(self.config.channel, [self.fadeMap[self.state.color.white], self.fadeMap[self.state.color.warmwhite]] )

                if(_target.warmwhite == source.warmwhite && _target.white == source.white)
                {
                  clearInterval(self.fadingTimerId)
                  _resolve()
                }

              }, 1)
            }
            else
            {
              // we also have to update the artnet if there is no difference in color
              // thats because we may come from a blackout and therefore there is not valid state (newState = state)
              self.sendToArtnet(self.state.color, self.state.brightness)
              _resolve()
            }
          }
          catch(_exception)
          {
              self.logError(_exception.toString())
              _reject(_exception)
          }
        })
      }


    }


    RED.nodes.registerType("habitat-node-thing-artnet-light", Habitat_Node_Thing_Artnet_Light)
  }
