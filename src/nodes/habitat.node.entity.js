"use strict"

const HabitatNode   = require('./habitat.node.js')

class HabitatNode_Entity extends HabitatNode
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
  }

  getEntityModuleId()
  {
    throw "Entity-Module is not specified"
  }

  getEntityId()
  {
    if(!this.config.entityId)
      throw "Entity-ID is not specified"
    return this.config.entityId
  }

  addNodeReferenceToHabitatContext()
  {
    this.habitatContextObject().nodes[this.getEntityId()] = this
  }

  removeNodeReferenceFromHabitatContext()
  {
    delete this.habitatContextObject().nodes[this.getEntityId()]
  }

  state()
  {
    if(!this.habitatAppNode().getEntityStates[this.entityId])
      this.habitatAppNode().getEntityStates[this.entityId] = this.getDefaultState()
    return this.habitatAppNode().getEntityStates[this.entityId]
  }

  getDefaultState()
  {
    throw 'Default state is not specified'
  }


  ready()
  {
    // every thing node stores a reference in the global context within the habitat object
    // this is good for distributing the messages via entityId. The reference is beeing removed when
    // the node is closed/destroyed
    this.addNodeReferenceToHabitatContext()
  }

  async cleanup()
  {
    await super.cleanup()

    // closing/destroying the node leads to removing the instance from the global context
    this.removeNodeReferenceFromHabitatContext()
  }

}

module.exports = HabitatNode_Entity