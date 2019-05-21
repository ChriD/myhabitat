'use strict'

const MyHabitatAdapter  = require("./myhabitat.adapter.js")
const LogLevel          = require("../globals/myhabitat.global.log.js").LogLevel


class MyHabitatAdapter_Log extends MyHabitatAdapter
{
  constructor(_entityId)
  {
    super(_entityId)

    this.adapterStateInterval       = 7500
    //this.adapterStateOutputEnabled  = false

    this.adapterState.counters = {}
    this.adapterState.counters.logError     = 0
    this.adapterState.counters.logWarning   = 0
    this.adapterState.counters.logFatal     = 0
    this.adapterState.counters.logAll       = 0
  }


  getEntityModuleId()
  {
    return "LOG"
  }


  logEnabled()
  {
    return false
  }


  setup(_configuration)
  {
    super.setup(_configuration)
  }


  close()
  {
    super.close()
  }


  input(_data)
  {
    this.adapterState.counters.logAll++

    switch(_data.type)
    {
      case LogLevel.FATAL:
        this.adapterState.counters.logFatal++
        break
      case LogLevel.ERROR:
        this.adapterState.counters.logError++
        break
      case LogLevel.WARNING:
        this.adapterState.counters.logWarning++
        break
    }

    if(_data.type <= this.configuration.logLevel)
      console.log(JSON.stringify(new Date()) + ' [' + _data.moduleId + '] (' + _data.entityId + ')' + ' : ' + _data.text)
  }

}


module.exports = MyHabitatAdapter_Log