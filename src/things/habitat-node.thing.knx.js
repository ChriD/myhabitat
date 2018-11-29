
"use strict"

const Habitat_Node_Thing  = require('./habitat-node.thing.js')


class Habitat_Node_Thing_KNX extends Habitat_Node_Thing
{
  constructor(_RED, _config)
  {
    super(_RED, _config)

    this.groupAddressFilter = []

    // this is a array of datapoints which are 'feedback' datapoints
    // those datapoints will rise and event if their value was changed
    this.feedbackDatapoints = []
  }

  /**
   * returns the type of the thing
   * @return {string}
   */
  getThingType()
  {
    return "KNX"
  }


   /**
   * returns the type of the thing
   * @return {string}
   */
  getKnxAdapterId()
  {
    if(this.config.adapterId)
      return this.config.adapterId
    return "KNX_01"
  }


  /**
   * returns the knx adapter node
   * @return {Object}
   */
  getKnxAdapter()
  {
    return this.adapters()[this.getKnxAdapterId()]
  }


  /**
   * will be called when all nodes are started
   */
  nodesStarted()
  {
    var self = this
    super.nodesStarted()

    // the node has to be aware when a ga was reveiced on the bus
    self.getKnxAdapter().on("gaReceived", function(_source, _destination, _value, _valueObject){
      // only listen to GA's defined in the group address filter list
      if(self.groupAddressFilter.includes(_destination))
        self.knxDataReceived(_source, _destination, _value, _valueObject)
    })

    // we shoud be aware of the bus connection state
    self.getKnxAdapter().on("connectionStateChanged", function(_isConnected){
      self.knxConnectionStateChanged(_isConnected)
    })

    // if the connection was already establishes by the knx adapter before we did attach the event handler for connectionStateChanged
    // we have to 'simulate' the event by calling it directly
    if(self.getKnxAdapter().isConnected)
      self.knxConnectionStateChanged(true)
  }


  /**
   * is called when the connection to the knx bus was established
   */
  knxConnectionStateChanged(_isConnected)
  {
    if(_isConnected)
    {
      // if the connection was established we have to bind the datapoints to this connection!
      for(let i=0; i<this.feedbackDatapoints.length; i++)
        this.feedbackDatapoints[i].bind(this.getKnxAdapter().knx)
    }
  }


  addFeedbackDatapoint(_ga, _dataType)
  {
    var self = this
    var datapoint = new KNX.Datapoint({ga: _ga, dpt: _dataType, autoread: true})
    datapoint.on("change", function(_currentValue, _value, _ga){
      self.logDebug("Datapoint " + _ga + " changed its value to: " + _currentValue + " | " + _value)
      self.feedbackDatapointChanged(_ga, _currentValue, _value)
    })
    self.feedbackDatapoints.push(datapoint)
    self.groupAddressFilter.push(_ga)
    return datapoint
  }


  /**
   * is called whenever a value of a registered feedback datapoint is changing
   * @param {String} _ga ga which value has changed
   * @param {anytype} _oldValue old value of the ga
   * @param {anytype} _value new value of the ga
   */
  feedbackDatapointChanged(_ga, _oldValue, _value)
  {
  }


  /**
   * is called when knx data was received
   * @param {string} _source
   * @param {string} _destination
   * @param {string} _value
   * @param {Object} _valueObject
   */
  knxDataReceived(_source, _destination, _value, _valueObject)
  {
  }


}

module.exports = Habitat_Node_Thing_KNX