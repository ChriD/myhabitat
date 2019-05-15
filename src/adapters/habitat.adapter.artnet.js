
/**
 * This class is an adapter for the habitat system which provides writable access to the ARTNET (DMX) universe
 * it uses the artnet library from https://github.com/hobbyquaker/artnet
 *
 *
 * TODOS: - Better Connection handling (error/connect)
 *          Problem is that the artnet connection is via udp socket (broadcast) and there is no info if it worked or not
 *        - maybe disable throttle of library because we make our own at 100HZ?
 *        - maybe change to https://github.com/margau/dmxnet ?!
 *
 */


'use strict'

const HabitatAdapter    = require("./habitat.adapter.js")
const Artnet            = require('artnet')


class HabitatAdapter_Artnet extends HabitatAdapter
{
  constructor(_entityId)
  {
    super(_entityId)

    const self = this

    self.artnet                 = null

    // this buffer contains the current value which will be sent to the artnet protocol
    self.buffer                 = [512]
    self.bufferUpdateInterval   = 10

    // clear the buffer
    for(var idx=0; idx<=512; idx++)
      self.buffer[idx] = 0

    // this one contains all actions which are pending (set/fade/..) and which have to be
    // processed by the main loop. E.g.:
    // { channel: 1, value : 133,  action : 'fade', step: 0.34 }
    // { channel: 2, value : 75,   action : 'set' }
    self.bufferAction = []

    // the buffer has to be updated on intervall, if there is something to do the changes
    // will be sent to the artnet library
    self.bufferUpdateIntervalId = setInterval(function(){
      self.updateArtnetBuffer()
    }, self.bufferUpdateInterval)


    self.adapterState.connection = {}
    self.adapterState.connection.host             = ""
    self.adapterState.connection.port             = 0
    self.adapterState.connection.universe         = 0
    self.adapterState.connection.dataRefresh      = 0
    self.adapterState.counters = {}
    self.adapterState.counters.processedActions   = 0

  }


  getEntityModuleId()
  {
    return "ARTNET"
  }


  setup(_configuration)
  {
    super.setup(_configuration)
    this.setupArtnetConnection()
  }


  setupArtnetConnection()
  {
    const self = this
    self.artnet = new Artnet(this.configuration)

    self.adapterState.connection.host         = self.configuration.host
    self.adapterState.connection.port         = self.configuration.port
    self.adapterState.connection.universe     = self.configuration.universe
    self.adapterState.connection.dataRefresh  = self.configuration.refresh

    self.logDebug('Establish connection to ' + self.configuration.host + ':' + self.configuration.port)

    self.artnet.on('error', function(_error){
        self.logError("Error: " + _error.toString(), _error)
      })
  }


  close()
  {
    if(this.artnet)
        this.artnet.close()
    this.artnet = null

    if(this.bufferUpdateIntervalId)
      clearInterval(this.bufferUpdateIntervalId)

    super.close()
  }


  input(_data)
  {
    const channel   = _data.channel-1
    _data.action    = _data.action   ? _data.action.toUpperCase()    : "SET"

    switch(_data.action)
    {
      case "SET":
        // we can use a 1:1 link of the given data object. No need to copy.
        this.bufferAction[channel] = _data
        this.logTrace('Created buffer action SET with value: ' + this.bufferAction[channel].value)
        break
      case "FADETO":
        // we can use a 1:1 link of the given data object. No need to copy.
        // but we have to update/add and calc the step value each updateIntervall
        this.bufferAction[channel] = _data
        this.bufferAction[channel].fadeTime = this.bufferAction[channel].fadeTime ? this.bufferAction[channel].fadeTime : 250
        this.bufferAction[channel].step = ((this.bufferAction[channel].value - this.buffer[channel]) / this.bufferAction[channel].fadeTime) * this.bufferUpdateInterval
        this.logTrace('Created buffer action FADETO with step: ' + this.bufferAction[channel].step)
        break
      default:
        this.logError('Action \'' + _data.action + '\' not found!')
    }

    this.adapterState.counters.processedActions++
  }


  updateArtnetBuffer()
  {
    const self = this
    const keys = Object.keys(this.bufferAction)
    for(var idx=0; idx<keys.length; idx++)
    {
      var deleteBufferAction = false
      const actionObj = this.bufferAction[keys[idx]]
      switch(actionObj.action.toUpperCase())
      {
        case "FADETO":
          this.buffer[actionObj.channel-1] += actionObj.step
          if( (actionObj.step > 0 && this.buffer[actionObj.channel-1] >= actionObj.value) ||
              (actionObj.step < 0 && this.buffer[actionObj.channel-1] <= actionObj.value))
            {
              this.buffer[actionObj.channel-1] = actionObj.value
              deleteBufferAction = true
            }
          break
        case "SET":
          this.buffer[actionObj.channel-1] = actionObj.value
          deleteBufferAction = true
          break
        default:
          this.logError('Action \'' + actionObj.action + '\' not found!')
      }
      this.logTrace('Buffer ' + actionObj.action + ' action on channel: ' + (actionObj.channel).toString() +  ', value: ' +  this.buffer[actionObj.channel-1].toString())

      // remove the action buffer entry for the channel if the work is done (e.g. when we have reached the desired value)
      if(deleteBufferAction)
      {
        delete this.bufferAction[keys[idx]]
        this.logTrace('Buffer ' + actionObj.action + ' action on channel: ' + (actionObj.channel).toString() + ' deleted')
      }

      // update the value on the artnet library
      this.artnet.set(this.configuration.universe, actionObj.channel , this.buffer[actionObj.channel-1], function(_err, _res){
        if(_err)
          self.logError('Error setting artnet value: ' + _err.toString())
      })
    }
  }

}


module.exports = HabitatAdapter_Artnet