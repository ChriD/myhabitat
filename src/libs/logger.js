
"use strict"

const EventEmitter = require("events").EventEmitter;
const Queue = require('tiny-queue');

var LogType = Object.freeze({"FATAL":0, "ERROR":10, "WARNING":30, "INFO":40, "DEBUG":50, "SILLY":60})


class Logger extends EventEmitter
{
  constructor()
  {
    super()

    // we do use the 'tiny-queue' as replacement for the standard array because we do use a FIFO
    // style and therfore we have to use 'shift' method which would be slow on standard array
    this.logStack = new Queue()
    // the maximum size of the log FIFO buffer
    this.logBufferCountMax = 250
    // the  maximum og level which will be logged
    this.logLevelType = LogType.DEBUG;
  }


  add(_type, _source, _sourceId, _log, _additionalData)
  {
    // check base log level and skip logging if not active
    if(_type <= this.logLevelType)
      return
    // be sure we do not exceed the log buffer count, if we would exceed we do pop the vai FIFO style
    if(this.logStack.length >= this.logBufferCountMax )
        this.logStack.shift()
    // push the log onto the stack
    this.logStack.push({ "type" : _type, "source" : _source, "sourceId" : _sourceId, "text" : _log, "data" : _additionalData })
    this.log(_type, _source, _sourceId, _log, _additionalData)
    this.emit("log", {  "type"            : _type,
                        "sourceId"        : _sourceId,
                        "log"             : _log,
                        "additionalData"  : _additionalData
                      })
  }


  log(_type, _source, _sourceId, _log, _additionalData)
  {
    console.log(_type.toString() + " | " + _source + " | " + _sourceId + " : " + _log)
  }

}

module.exports = { Logger, LogType }