'use strict'

const MyHabitatAdapter  = require("./myhabitat.adapter.js")
const SysInfo           = require('systeminformation');


class MyHabitatAdapter_SystemInfo extends MyHabitatAdapter
{
  constructor(_entityId)
  {
    super(_entityId)

    this.adapterStateInterval       = 7500
    this.systemInfoIOInterval       = 0

    this.adapterState.cpu                 = {}
    this.adapterState.cpu.cores           = 0
    this.adapterState.cpu.physicalCores   = 0
    this.adapterState.cpu.speed           = 0
    this.adapterState.cpu.manufacturer    = ""
    this.adapterState.cpu.brand           = ""
    this.adapterState.cpu.temperature     = 0
    this.adapterState.cpu.loads           = {}
    this.adapterState.cpu.loads.current   = 0
    this.adapterState.cpu.loads.average   = 0
    this.adapterState.memory              = {}
    this.adapterState.memory.total        = 0
    this.adapterState.memory.free         = 0

    this.adapterState.disk                    = {}
    this.adapterState.disk.io                 = {}
    this.adapterState.disk.io.read            = 0
    this.adapterState.disk.io.write           = 0
    this.adapterState.disk.io.read_sec        = 0
    this.adapterState.disk.io.write_sec       = 0
    this.adapterState.disk.io.bytesRead_sec   = 0
    this.adapterState.disk.io.bytesWrite_sec  = 0
  }


  getEntityModuleId()
  {
    return "SYSTEMINFO"
  }


  setup(_configuration)
  {
    const self = this
    self.adapterStateInterval = _configuration.interval

    // the IO intervals should be calculated about each second for correct 'per second' values
    self.systemInfoIOInterval = setInterval(function(){
      self.updateSystemInfoIOData()
    }, 1000)

    super.setup(_configuration)
  }


  async updateSystemInfoIOData()
  {
    try
    {
      const disksIOData = await SysInfo.disksIO()
      this.adapterState.disk.io.read        = disksIOData.rIO
      this.adapterState.disk.io.write       = disksIOData.wIO
      this.adapterState.disk.io.read_sec    = disksIOData.rIO_sec
      this.adapterState.disk.io.write_sec   = disksIOData.wIO_sec
    }
    catch (_exception)
    {
      //this.logDebug(_exception.toString())
    }

    try
    {
      const fsStatsData = await SysInfo.fsStats()
      this.adapterState.disk.io.bytesRead_sec   = fsStatsData.rx_sec
      this.adapterState.disk.io.bytesWrite_sec  = fsStatsData.wx_sec
    }
    catch (_exception)
    {
      //this.logDebug(_exception.toString())
    }
  }


  async outputAdapterState()
  {
    await this.updateSystemInfo()
    super.outputAdapterState()
  }


  async updateSystemInfo()
  {
    try
    {
      const cpuData = await SysInfo.cpu()
      this.adapterState.cpu.cores           = cpuData.cores
      this.adapterState.cpu.physicalCores   = cpuData.physicalCores
      this.adapterState.cpu.speed           = cpuData.speed
      this.adapterState.cpu.manufacturer    = cpuData.manufacturer
      this.adapterState.cpu.brand           = cpuData.brand

    }
    catch (_exception)
    {
      //this.logDebug(_exception.toString())
    }

    try
    {
      const cpuTemperatureData = await SysInfo.cpuTemperature()
      this.adapterState.cpu.temperature = cpuTemperatureData.main

    }
    catch (_exception)
    {
      //this.logDebug(_exception.toString())
    }

    try
    {
      const currentLoadData = await SysInfo.currentLoad()
      this.adapterState.cpu.loads.current = currentLoadData.currentload.toFixed(0)
      this.adapterState.cpu.loads.average = currentLoadData.avgload

    }
    catch (_exception)
    {
      //this.logDebug(_exception.toString())
    }

    try
    {
      const memData = await SysInfo.mem()
      this.adapterState.memory.total = (memData.total / 1024 / 1024).toFixed(0)
      this.adapterState.memory.free  = (memData.free / 1024 / 1024).toFixed(0)

    }
    catch (_exception)
    {
      //this.logDebug(_exception.toString())
    }
  }


  close()
  {
    super.close()
    if(this.systemInfoIOInterval)
      clearInterval(this.systemInfoIOInterval)
  }


  input(_data)
  {
  }

}


module.exports = MyHabitatAdapter_SystemInfo