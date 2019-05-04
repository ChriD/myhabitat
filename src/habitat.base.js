
"use strict"

const EventEmitter  = require("events").EventEmitter

const LogType       = Object.freeze({"FATAL":0, "ERROR":10, "WARNING":30, "INFO":40, "DEBUG":50, "TRACE":60})


class HabitatBase extends EventEmitter
{
  constructor()
  {
    super()
  }

  getEntityModuleId()
  {
    throw "Entity-Module is not specified"
  }

  getEntityId()
  {
    if(!this.entityId)
      throw "Entity-ID is not specified"
    return this.entityId
  }

  logEnabled()
  {
    return true
  }

  log(_type, _log, _object)
  {
    try
    {
      if(this.logEnabled())
        this.emit("log", _type, this.getEntityModuleId(), this.getEntityId(), _log, _object)
    }
    catch(_exception)
    {
      console.log(_exception.toString())
      throw _exception.toString()
    }
  }

  logError(_log, _object)
  {
    this.log(LogType.ERROR, _log, _object)
  }

  logWarning(_log, _object)
  {
    this.log(LogType.WARNING, _log, _object)
  }

  logInfo(_log, _object)
  {
    this.log(LogType.INFO, _log, _object)
  }

  logDebug(_log, _object)
  {
    this.log(LogType.DEBUG, _log, _object)
  }

  logTrace(_log, _object)
  {
    this.log(LogType.TRACE, _log, _object)
  }

}

module.exports = HabitatBase


