
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
    this.observedGA           = []
    this.feedbackDatapoints   = []

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
      case "WRITE":
        this.knxWrite(_data.ga, _data.dpt, _data.value, _data.options)
        break
      case "OBSERVE":
        this.observeGA(_data.ga, _data.dpt, _data.options)
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
      loglevel        : "error", // error, debug, trace
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

    // Todo add handler in handler
    this.knx.on('disconnected', function(){
      self.knxDisconnected()
    })

  }

  knxConnectionStateChanged()
  {
    // if the state changes from 'not connected' to 'connected', we do a read request to all observed ga's
    // so that the subsribers get the actual data
    // TODO: run through the stored feedback datapoints and do a reread?

    // if the connection was established we have to bind the datapoints to this connection!
    //for(let i=0; i<this.feedbackDatapoints.length; i++)
    //  this.feedbackDatapoints[i].bind(this.getKnxAdapter().knx)

    //for(let i=0; i<this.feedbackDatapoints.length; i++)
    //  this.feedbackDatapoints[i].read()
  }


  knxConnected()
  {
    if(!this.adapterState.connection.connected)
    {
      this.logDebug('Connected to: ' + this.configuration.host + ':' + this.configuration.port)
      this.adapterState.connection.connected  = true
      this.adapterState.times.lastConnect     = new Date()
      this.knxConnectionStateChanged()
    }
  }

  knxDisconnected()
  {
    if(this.adapterState.connection.connected)
    {
      this.logDebug('Disconnected from: ' + this.configuration.host + ':' + this.configuration.port)
      this.adapterState.connection.connected  = false
      this.knxConnectionStateChanged()
    }
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


  knxWrite(_ga, _dpt, _value, _options)
  {
    var datapoint = new KNX.Datapoint({ga: _ga, dpt: _dpt}, this.knx)
    datapoint.write(_value)

    this.adapterState.counters.sent++
    this.adapterState.times.lastSent = new Date()
  }


  observeGA(_ga, _dpt, _options)
  {
    this.observedGA[_ga] = { ga : _ga, options : _options }
    this.addFeedbackDatapoint(_ga, _dpt)
    this.logDebug('Addded observation for group address \'' + _ga + '\' (' + _dpt + ')')
  }


  observeAll(_observeAll,  _options)
  {
    this.globalObservation = _observeAll
    this.logDebug(this.globalObservation ? 'Addded global observation' : 'Removed global observation')
  }


  addFeedbackDatapoint(_ga, _dataType)
  {
    const self = this
    // lets create a datapoint with the ability of autoread.
    // That means it will be read when the connection is beeing established
    const datapoint = new KNX.Datapoint({ga: _ga, dpt: _dataType, autoread: true}, self.knx)
    datapoint.on("change", function(_currentValue, _value, _ga){
      // there is no need to do anything here weith the infi that the datapoint has been changed
      // this will be catched by the 'knxEvent' method anyway!
    })
    self.feedbackDatapoints.push(datapoint)
  }

}


module.exports = HabitatAdapter_KNX