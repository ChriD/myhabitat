'use strict'

const MyHabitatAdapter  = require("./myhabitat.adapter.js")
const Connect           = require('connect')
const ServeStatic       = require('serve-static')


class HabitatAdapter_Webserver extends MyHabitatAdapter
{
  constructor(_entityId)
  {
    super(_entityId)

    this.adapterStateInterval       = 7500
    //this.adapterStateOutputEnabled  = false

    this.server = null

    this.adapterState.connection = {}
    this.adapterState.connection.port     = 0
    this.adapterState.connection.path     = ""
    this.adapterState.counters = {}
  }


  getEntityModuleId()
  {
    return "WEBSERVER"
  }


  setup(_configuration)
  {
    const self = this

    self.adapterState.connection.port = _configuration.port
    self.adapterState.connection.path = _configuration.path

    try
    {
      self.server = Connect()
      self.server.use(ServeStatic(_configuration.path))
      self.server.on('error', function(_err){
        self.logError("Starting webserver failed: " + _err)
      })
      self.server.listen(_configuration.port, function(){
        self.logInfo('Webserver is running on port: ' + _configuration.port +  ' serving ' + _configuration.path)
      })
    }
    catch(_exception)
    {
      self.logError("Starting webserver failed: " + _exception.toString(), exception)
    }

    super.setup(_configuration)
  }


  close()
  {
    super.close()
  }


  input(_data)
  {
  }

}


module.exports = HabitatAdapter_Webserver