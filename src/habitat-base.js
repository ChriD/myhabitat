
"use strict"

const EventEmitter = require("events").EventEmitter;


/**
 * This is the base class all habitat classes will be derived from.
 * It contains some basic functionality which is needed in all derived children
 */
class Habitat_Base extends EventEmitter
{
  constructor()
  {
    super()
  }

   /**
   * returns the prefix for the logs. should be overwritten
   * @return {String} the prefix for every log
   */
  getLogPrefix()
  {
    return ""
  }


  log(_type, _log, _object)
  {
    this.emit("log", _type, this.getLogPrefix() + " " + _log, _object)
  }


  logError(_log, _object)
  {
    this.log(0, _log, _object)
  }


  logWarning(_log, _object)
  {
    this.log(1, _log, _object)
  }


  logInfo(_log, _object)
  {
    this.log(2, _log, _object)
  }


  logDebug(_log, _object)
  {
    this.log(3, _log, _object)
  }

}

module.exports = Habitat_Base