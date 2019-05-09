'use strict'

const HabitatBase  = require('../habitat.base.js')


class HabitatAdapter extends HabitatBase
{
  constructor(_entityId)
  {
    super()

    const self = this

    self.entityId         = _entityId
    self.configuration    = {}

    self.adapterState               = {}
    self.adapterStateInterval       = 2500
    self.adapterStateOutputEnabled  = true

    // create a interval to send a ping to the main process each defined time,
    // so the main process does know that we are working bravely for its satisfaction
    self.adapterPingIntervalId = setInterval(function(){
      self.outputAdapterPing()
    }, 1000)


    self.on('log', function(_type, _moduleId, _entityId, _log, _object){
      process.send({adapter : {   entity    : self.createEntityObject(),
                                  log       : { type      : _type,
                                                moduleId  : _moduleId,
                                                entityId  : _entityId,
                                                text      : _log,
                                                object    : _object
                                              }
                              }
                    })
    })

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


  dataIn(_dataIn)
  {
    this.logTrace("dataIn: " + JSON.stringify(_dataIn))

    if(!_dataIn)
      return

    if(_dataIn.adapter && _dataIn.adapter.action === "setup")
      this.setup(_dataIn.adapter.configuration)

    if(_dataIn.adapter && _dataIn.adapter.action === "close")
      this.close()

    if(_dataIn.data)
      this.input(_dataIn.data)
  }


  dataOut(_dataOut)
  {
    this.emit("dataOut", _dataOut)
  }


  createEntityObject()
  {
    return  { id        : this.entityId,
              moduleId  : this.getEntityModuleId() }
  }


  outputAdapterPing()
  {
    const output =  { adapter : { entity  : this.createEntityObject(),
                                  ping    : true
                                }
                    }
    process.send(output)
  }


  outputAdapterState()
  {
    const output =  { adapter : { entity  : this.createEntityObject(),
                                  state   : this.adapterState
                                }
                    }
    process.send(output)
  }


  output(_data)
  {
    const output =  { adapter : {  entity  : this.createEntityObject()
                                },
                      data    : _data
                    }
    this.dataOut(output)
  }


  input(_data)
  {
  }


  setup(_configuration)
  {
    const self = this

    self.configuration = _configuration

    // setup the intervall for the adapter state output message so that the habitat system is up to date
    // of the state of the system. Hoewever, the 'outputAdapterState' may deny sending the state (e.g. nothing changed?)
    self.adapterStateIntervalId = setInterval(function(){
      if(self.adapterStateOutputEnabled)
        self.outputAdapterState()
    }, self.adapterStateInterval)

    self.outputAdapterState()
  }


  close()
  {
    if(this.adapterStateIntervalId)
      clearInterval(this.adapterStateIntervalId)
    if(this.adapterPingIntervalId)
      clearInterval(this.adapterPingIntervalId )
  }


}


module.exports = HabitatAdapter