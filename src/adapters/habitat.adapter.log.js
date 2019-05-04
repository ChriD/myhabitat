'use strict'

const HabitatAdapter = require("./habitat.adapter.js")


class HabitatAdapter_Log extends HabitatAdapter
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
      case 0:
        this.adapterState.counters.logFatal++
        break
      case 10:
        this.adapterState.counters.logError++
        break
      case 30:
        this.adapterState.counters.logWarning++
        break
    }

    console.log(JSON.stringify(new Date()) + ' [' + _data.moduleId + '] (' + _data.entityId + ')' + ' : ' + _data.text)
  }

}


module.exports = HabitatAdapter_Log