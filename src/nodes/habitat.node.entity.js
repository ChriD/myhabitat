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

  getEntity()
  {
    return {
      id        : this.getEntityId(),
      moduleId  : this.getEntityModuleId()
    }
  }

  ready()
  {
    super.ready()
    // calling the state method will create an initial state object from the 'getDefaultState' method
    // this call is not mandatory but it will ensure that all nodes which are ready have their complete
    // state object for further use
    this.state()
  }

  addNodeReferenceToHabitatContext()
  {
    this.habitatContextObject().nodes[this.getEntityId()] = this
  }

  removeNodeReferenceFromHabitatContext()
  {
    delete this.habitatContextObject().nodes[this.getEntityId()]
  }

  stateObject()
  {
    if(!this.habitatAppNode().getEntityStates()[this.getEntityId()])
      this.habitatAppNode().getEntityStates()[this.getEntityId()] = { entity : this.getEntity(), state : this.getDefaultState(), originator : {}, specification : {} }
      return this.habitatAppNode().getEntityStates()[this.getEntityId()]
  }

  state()
  {
    return this.stateObject().state
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
    super.ready()
  }

  async cleanup()
  {
    await super.cleanup()

    // closing/destroying the node leads to removing the instance from the global context
    this.removeNodeReferenceFromHabitatContext()
  }

}

module.exports = HabitatNode_Entity