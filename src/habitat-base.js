
"use strict"

const EventEmitter = require("events").EventEmitter;
const Logger = require('./libs/logger.js')

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

  /**
   * @return {String}
   */
  getLogUnique()
  {
    return ""
  }


  log(_type, _log, _object)
  {
    this.emit("log", _type, this.getLogPrefix(), this.getLogUnique(), _log, _object)
  }


  logError(_log, _object)
  {
    this.log(Logger.LogType.ERROR, _log, _object)
  }


  logWarning(_log, _object)
  {
    this.log(Logger.LogType.WARNING, _log, _object)
  }


  logInfo(_log, _object)
  {
    this.log(Logger.LogType.INFO, _log, _object)
  }


  logDebug(_log, _object)
  {
    this.log(Logger.LogType.DEBUG, _log, _object)
  }


  logSilly(_log, _object)
  {
    this.log(Logger.LogType.SILLY, _log, _object)
  }

}

module.exports = Habitat_Base