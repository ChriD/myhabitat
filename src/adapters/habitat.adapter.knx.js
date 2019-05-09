
/**
 * This class is an adapter for the habitat system which provides access to the KNX bus
 * It uses the knx library from https://bitbucket.org/ekarak/knx.js
 *
 *
 * TODOS: - Better Connection handling (endless reconnect + info when connection error!)
 *        - redirect logs from the underlaying knx library
 *
 */


'use strict'

const HabitatAdapter  = require("./habitat.adapter.js")
const KNX             = require('knx')
const DPTLib          = require('knx/src/dptlib')

class HabitatAdapter_KNX extends HabitatAdapter
{
  constructor(_entityId)
  {
    super(_entityId)

    this.knx                  = null
    this.globalObservation    = false
    this.observedGA           = new Array()

    this.adapterState.connection = {}
    this.adapterState.connection.connected        = false
    this.adapterState.connection.host             = ""
    this.adapterState.connection.port             = 0
    this.adapterState.counters = {}
    this.adapterState.counters.receivedObserved   = 0
    this.adapterState.counters.received           = 0
    this.adapterState.counters.sent               = 0
    this.adapterState.times = {}
    this.adapterState.times.lastReceivedObserved  = null
    this.adapterState.times.lastReceived          = null
    this.adapterState.times.lastSent              = null
    this.adapterState.times.lastConnect           = null

  }

  getEntityModuleId()
  {
    return "KNX"
  }


  setup(_configuration)
  {
    super.setup(_configuration)
    this.setupKNXConnection()
  }


  close()
  {
    this.logDebug('Closing KNX connection')
    if(this.knx)
      this.knx.Disconnect()
    super.close()
  }


  input(_data)
  {
    _data.action    = _data.action   ? _data.action.toUpperCase()    : "WRITE"
    _data.datatype  = _data.datatype ? _data.datatype.toUpperCase()  : "DPT1.001"

    switch(_data.action)
    {
      case "READ":
        this.knxRead(_data.ga, _data.datatype)
        break
      case "WRITE":
        this.knxWrite(_data.ga, _data.datatype, _data.value)
        break
      case "OBSERVE":
        this.observeGA(_data.ga, _data.options)
        break
      case "OBSERVEALL":
        this.observeAll(true, _data.options)
        break
      default:
        this.logError('Action \'' + _data.action + '\' not found!')
    }
  }


  setupKNXConnection()
  {
    var self = this

    if(this.knx)
      this.knx.Disconnect()

    this.adapterState.connection.host   = this.configuration.host
    this.adapterState.connection.port   = this.configuration.port

    this.knx = KNX.Connection({
      ipAddr          : this.configuration.host,
      ipPort          : this.configuration.port,
      forceTunneling  : this.configuration.forceTunneling,
      loglevel        : "error",
      handlers: {
        connected: function() {
          self.knxConnected()
        },
        event: function(_event, _source, _destination, _value) {
          self.knxEvent(_event, _source, _destination, _value)
        },
        error: function(_connstatus) {
          self.knxError(_connstatus)
        }
      }
    })

  }

  knxConnectionStateChanged()
  {
    this.output( { connectionState : this.adapterState.connection.connected } )
  }


  knxConnected()
  {
    this.logDebug('Connected to: ' + this.configuration.host + ':' + this.configuration.port)
    this.adapterState.connection.connected  = true
    this.adapterState.times.lastConnect     = new Date()
    this.knxConnectionStateChanged()
  }


  knxError(_connstatus)
  {
    this.logError("Error: " + _connstatus.toString())
    this.adapterState.connection.connected  = false
    this.adapterState.times.lastConnect     = null
    this.knxConnectionStateChanged()
  }


  knxEvent(_event, _source, _destination, _value)
  {
    const self  =  this
    const now   =  new Date()

    self.logTrace(_event.toUpperCase() + ', source: ' + _source + ', destination: ' + _destination + ', value: ' + _value['0'])

    self.adapterState.counters.received++
    self.adapterState.times.lastReceived = now

    // return if we do not observe the destination GA, there is no need to do any further stuff
    if(!self.observedGA[_destination] && !self.globalObservation)
      return

    var value = _value['0']

    // check if there is a GA/DPT information, if so we can format the value based on the DPT
    // if there is no DPT we send back the raw value
    try
    {
      const dptId = self.observedGA[_destination].options ? self.observedGA[_destination].options.dpt : ""
      self.logTrace("Convert incoming value to DPT: " + (dptId ? dptId : "No DPT value defined!"))
      value =  dptId ? DPTLib.fromBuffer(_value, DPTLib.resolve(dptId)) : value
    }
    catch(_exception)
    {
      self.logError("Error converting incoming value to DPT: " + (dptId ? dptId : "No DPT value defined!"), _exception)
    }

    self.adapterState.counters.receivedObserved++
    self.adapterState.times.lastReceivedObserved = now

    self.logTrace('Output data for observed ga \'' + _destination + '\' : ' + value)
    self.output( { event : _event, source : _source, destination : _destination, value : value, valueRaw : _value } )
  }


  knxWrite(_ga, _datatype, _value)
  {
    var datapoint = new KNX.Datapoint({ga: _ga, dpt: _datatype}, this.knx)
    datapoint.write(_value)

    self.adapterState.counters.sent++
    self.adapterState.times.lastSent = new Date()
  }


  knxRead(_ga, _datatype)
  {
    var datapoint = new KNX.Datapoint({ga: _ga, dpt: _datatype}, self.knx)
    datapoint.read()
  }


  observeGA(_ga, _options)
  {
    this.observedGA[_ga] = { options : _options }
    this.logDebug('Addded observation for group address \'' + _ga + '\'')
  }


  observeAll(_observeAll,  _options)
  {
    this.globalObservation = _observeAll
    this.logDebug(this.globalObservation ? 'Addded global observation' : 'Removed global observation')
  }

}


module.exports = HabitatAdapter_KNX