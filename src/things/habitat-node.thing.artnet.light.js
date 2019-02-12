

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

        // we do need a state which all transitions/tast will access when they do their stuff whcih
        // should/dioes not affect tjhe main state
        self.transitionState = {}

        // timer id which will be > 0 when fading is currently running
        self.fadingTimerId = 0
        // intervall id for dimming to a specific brightness
        self.brightnessIntervallId = 0
        //
        self.isTaskRunning = false

        //self.

        // TODO: @@@
        this.config.dimFadeDuration   = 254
        this.config.colorFadeDuration = 254

        RED.nodes.createNode(self, _config)

        // we have to call the created event for some stuff which will be done in the base class
        // this is a 'have to'!
        self.created()

        self.on('input', function(_msg) {
          // we have to create a new state object wwhere we do change the values given from the input
          // with this state we can call the applystate function
          var newState    = self.copyObject(this.state)
          var value       = _msg.payload
          var updateState = true

          switch(typeof value)
          {
            // if we get a number we do interpret it as ON/OFF value (0=OFF / >0=ON)
            case "number":
              newState.isOn = (value == 0 ? false : true)
              break

            // if we get a boolean we do interpret it as ON/OFF value
            case "boolean":
              newState.isOn = value
              break

            // if we get a string it may be a predefined action or a scene identifier
            // predefined actions are : "TOGGLE"
            case "string":
              if(value.toUpperCase() == "TOGGLE")
              {
                newState.isOn = !newState.isOn
              }
              else
              {
                self.applyScene(value.toUpperCase())
                updateState = false
              }
              break

            // if the input is an object, we assume that it is a "habitat multi purpose object"
            // a multi purpose object has a type which let's us know what the data is for
            case "object":
              if(value.type && value.data)
              {
                switch(value.type.toUpperCase())
                {
                  case "STATE":
                    newState = self.combineStates(value.data, self.state)
                    break
                  case "SCENE":
                    self.applyScene(value.data.sceneId)
                    updateState = false
                    break
                }
              }
              else
              {
                  self.logWarning("Wrong object type for " + self.getThingId())
                  updateState = false
              }
              break

            // give some warning if we do not have any valid input
            default:
              self.logWarning("Wrong input type for " + self.getThingId())
              updateState = false
              break
          }

          // apply the new state set updated by the input if no other action has updated
          // the state or if there are any errors or wrong inputs
          if(updateState)
            self.setState(newState, false)

        });
      }


       /**
       * upgradeState
       */
      upgradeState(_state)
      {
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


      stopAndWaitForTaskToFinish()
      {
        var self = this
        return new Promise((_resolve, _reject) => {
          // set the task abortion variable which will be checked by the tasks if set
          // it it's set the tasks will abort
          self.requestTaskAbortion = true
          var checkInterval = setInterval(function(){
            if(!self.isTaskRunning)
            {
              self.requestTaskAbortion = false
              clearInterval(checkInterval)
              _resolve()
            }
          }, 10)
        })
      }


      applyState(_newState)
      {
        var self = this
        var proms = new Array()

        return new Promise((_resolve, _reject) => {

          // when there is a task (dim, fade,..) running, we have to stop the task before we are
          // able to apply the new task
          self.stopAndWaitForTaskToFinish().then(function(){

            try
            {
              // set a marker so thet the object knows that there is an ongoing task
              // if another task is started while some task is running, the running tast will be stopped
              self.isTaskRunning = true

              // prepare the transition state for all the actions the apply eill call
              self.transitionState = self.copyObject(self.state)

              if(_newState.isOn && !self.state.isOn)
              {
                // if the state has toggled the light to on, we have to turn on the lamp to the new brightness value
                // and the new? color
                proms.push(self.turnOn(_newState.brightness, _newState.color))
              }
              else if(!_newState.isOn && self.state.isOn)
              {
                // when turning off we do not need to fade to any color, no matter if another color is given or not
                // the color will aplly on the next turn on of the lamp due the state wi be combined anyway
                proms.push(self.turnOff())
              }
              else
              {
                // when the on/off state of the lamp is is not changeing we dim to brightness and fade to color
                // dimming and fading at the same time should use the same dimming and color values!
                // so we do use the self.transitionState inside of dimTo and fadeTo
                proms.push(self.dimTo(_newState.brightness))
                proms.push(self.fadeTo(_newState.color))
              }

              // if all the fading and dimming is done we do store/commit the new state as the last state
              // we do not want to have a state saved when it's in dimming or fading mode
              Promise.all(proms).then(function(){
                // be sure we do set the whole new state to the current state but do not loose any vars!
                // so we do combine the new state with the old one
                self.state = self.combineStates( _newState, self.state)
                self.saveLastState()
                self.updateNodeInfoState()
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

            self.isTaskRunning = false

          })

        })

      }


      sendToArtnet(_color = this.state.color, _brightness = this.state.brightness, _isOn = this.state.isOn)
      {
        var channels
        var values

        // be sure we do have valid values for the artnet library
        this.normalizeColorObject(_color)

        // for each light type we have, we have to set up the channels and the values
        switch(this.config.lightType)
        {
          case "ONE":
            channels  = [this.config.channelWhite]
            values    = [_color.white]
            break
          case "TW":
            channels  = [this.config.channelWhite, this.config.channelWarmWhite]
            values    = [_color.white, _color.warmwhite]
            break
          case "RGB":
            channels  = [this.config.channelRed, this.config.channelGreen, this.config.channelBlue]
            values    = [_color.red, _color.green, _color.blue]
            break
          case "RGBW":
            channels  = [this.config.channelRed, this.config.channelGreen, this.config.channelBlue, this.config.channelWhite]
            values    = [_color.red, _color.green, _color.blue, _color.white]
            break
          default:
            self.logError("light type is not supported")
        }

        // we do send the values each by each so we can have gaps between the channels
        for(var i = 0; i < channels.length; i++)
        {
          this.getArtnetAdapter().sendToArtnet(channels[i], Math.round(values[i] * _brightness) * (_isOn ? 1 : 0))
        }
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
      turnOn(_brightness = this.state.brightness, _color = null)
      {
        var self = this

        return new Promise(function(_resolve, _reject)
        {
          try
          {
            // in fact if the light is already on we do not have to do anything, but to be sure (in case of blackout or something like that)
            // we do update the values on the artnet
            if(self.state.isOn)
            {
              // if the lamp was already on and we got a color object, we try to fade to that color object
              // in fact this is very rare stuff
              if(_color)
              {
                self.fadeTo(_color).then(function(){
                  _resolve()
                }).catch(function(_exception){
                  _reject(_exception)
                })
              }
              else
              {
                // only a fallback for "blackout"
                self.sendToArtnet()
                _resolve()
              }
              return
            }

            // if we got a color we do set it before we turn on the lamp
            // on turn on there should be no color fading so we can set it directly
            if(_color)
              self.state.color = self.copyObject(_color)

            // we have to set the state to 'on' before we start the dimming to the dim value, otherwise the
            // values wont be calculated in the 'sendToArtnet' method
            // Be aware that the on/off dimming will not affect the brightness value on the state
            self.state.isOn = true
            self.dimTo(_brightness, 0).then(function(){
              self.stateUpdated()
              self.saveLastState()
              self.updateNodeInfoState()
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
              self.updateNodeInfoState()
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

            var taskAbortionInterval = setInterval(function(){
              if(self.requestTaskAbortion)
              {
                self.logDebug("CLAER DIM INTERVAL")
                clearInterval(self.brightnessIntervallId)
                clearInterval(taskAbortionInterval)
                _resolve()
              }
            }, 5)

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

                // update taskState with the new brightness value
                self.transitionState.brightness = _fromBrightness

                self.sendToArtnet(self.state.color, _fromBrightness)
                if(_fromBrightness == _brightness)
                {
                  clearInterval(self.brightnessIntervallId)
                  clearInterval(taskAbortionInterval)
                  _resolve()
                }
              }, stepTime)
            }
            // we also have to update the artnet if there is no difference in brightness
            // thats because we may come from a blackout and theerfore therefore is not valid state (newState = state)
            else
            {
              self.sendToArtnet(self.state.color, self.state.brightness)
              clearInterval(taskAbortionInterval)
              _resolve()
            }
          }
          catch(_exception)
          {
              self.logError(_exception.toString())
              clearInterval(taskAbortionInterval)
              _reject(_exception)
          }
        })
      }


      /**
       * fade option
       * TODO: should be made faster & better
       * */
      fadeTo(_target, _duration =  this.config.colorFadeDuration)
      {
        var self = this

        return new Promise(function(_resolve, _reject)
        {
          try
          {
            // if there is no target object then resolve and leave immediately
            // this should not be the case at all but there may be corrupt or wrong states given!
            if(!_target)
            {
              _resolve()
              return
            }

            var duration      = _duration
            var intervalTime  = 0
            var source        = self.state.color

            self.normalizeColorObject(source)

            // calculate the ms each color has to be updated
            var whiteDiff     = _target.white - source.white
            var warmWhiteDiff = _target.warmwhite - source.warmwhite
            var redDiff       = _target.red - source.red
            var greenDiff     = _target.green - source.green
            var blueDiff      = _target.blue - source.blue

            // clear the current fading if we are starting a new one
            if(self.fadingTimerId)
              clearInterval(self.fadingTimerId)

            var taskAbortionInterval = setInterval(function(){
              if(self.requestTaskAbortion)
              {
                self.logDebug("CLAER FADE INTERVAL")
                clearInterval(self.fadingTimerId)
                clearInterval(taskAbortionInterval)
                _resolve()
              }
            }, 5)

            if(whiteDiff || warmWhiteDiff || redDiff || greenDiff || blueDiff)
            {
              var whiteMS     = Math.abs(Math.round(duration / whiteDiff))
              var warmWhiteMS = Math.abs(Math.round(duration / warmWhiteDiff))
              var redMS       = Math.abs(Math.round(duration / redDiff))
              var greenMS     = Math.abs(Math.round(duration / greenDiff))
              var blueMS      = Math.abs(Math.round(duration / blueDiff))

              if(!whiteMS && whiteDiff)         whiteMS = 1
              if(!warmWhiteMS && warmWhiteDiff) warmWhiteMS = 1
              if(!redMS && redDiff)             redMS = 1
              if(!greenMS && greenDiff)         greenMS = 1
              if(!blueMS && blueDiff)           blueMS = 1

              // set up the fading timer/interval (the timer will be set up for 1 milisecond)
              self.fadingTimerId = setInterval(function(){
                intervalTime += 1
                if(whiteMS && intervalTime % whiteMS == 0 && source.white != _target.white)
                  source.white += 1 * (_target.white < source.white ? -1 : 1)
                if(warmWhiteMS && intervalTime % warmWhiteMS == 0 && source.warmwhite != _target.warmwhite)
                  source.warmwhite += 1 *  (_target.warmwhite < source.warmwhite ? -1 : 1)
                if(redMS && intervalTime % redMS == 0 && source.red != _target.red)
                  source.red += 1 * (_target.red < source.red ? -1 : 1)
                if(greenMS && intervalTime % greenMS == 0 && source.green != _target.green)
                  source.green += 1 * (_target.green < source.green ? -1 : 1)
                if(blueMS && intervalTime % blueMS == 0 && source.blue != _target.blue)
                  source.blue += 1 * (_target.blue < source.blue ? -1 : 1)

                // update taskState with the new color values.
                // #DEV: we may use a direct link to instead of deep copying the object (performance?!)
                self.transitionState.color = self.copyObject(source)

                // #DEV: #TODO: only update when something changed
                self.sendToArtnet(source)

                if( (_target.warmwhite == source.warmwhite || !whiteMS)  &&
                    (_target.white == source.white || !warmWhiteMS) &&
                    (_target.red == source.red || !redMS) &&
                    (_target.green == source.green || !greenMS) &&
                    (_target.blue == source.blue || !blueMS))
                {
                  clearInterval(self.fadingTimerId)
                  clearInterval(taskAbortionInterval)
                  _resolve()
                }

              }, 1)
            }
            else
            {
              // we also have to update the artnet if there is no difference in color
              // thats because we may come from a blackout and therefore there is not valid state (newState = state)
              self.sendToArtnet(self.state.color, self.state.brightness)
              clearInterval(taskAbortionInterval)
              _resolve()
            }
          }
          catch(_exception)
          {
              clearInterval(taskAbortionInterval)
              self.logError(_exception.toString())
              _reject(_exception)
          }
        })
      }


      /**
       * should be called when the appearance of the node in the node-red gui has to be updated
       * in this case we do show  if the lamp is on/off and the brightness
       */
      updateNodeInfoState()
      {
        let infoText = Math.round((this.state.brightness * 100)).toString() + "%"
        let infoFill = this.state.isOn ? "green" : "red"
        this.status({fill:infoFill, shape:"dot", text: infoText})
      }


    }


    RED.nodes.registerType("habitat-node-thing-artnet-light", Habitat_Node_Thing_Artnet_Light)
  }
