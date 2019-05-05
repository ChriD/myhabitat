"use strict"

const HabitatNode   = require('./habitat.node.js')

class HabitatNode_Entity extends HabitatNode
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
    this.entityId = ''
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
}

module.exports = HabitatNode_Entity