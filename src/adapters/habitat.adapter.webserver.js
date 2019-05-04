'use strict'

const HabitatAdapter  = require("./habitat.adapter.js")
const Connect         = require('connect')
const ServeStatic     = require('serve-static')


class HabitatAdapter_Webserver extends HabitatAdapter
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

    self.server = Connect()
    self.server.use(ServeStatic(_configuration.path))
    self.server.listen(_configuration.port, function(){
      self.logInfo('Webserver is running on port: ' + _configuration.port +  ' serving ' + _configuration.path)
    })

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