"use strict"

const MyHabitatNode   = require('./myhabitat.node.js')

class MyHabitatNode_Entity extends MyHabitatNode
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
    // every entity node stores a reference in the global context within the habitat object
    // this is good for distributing the messages via entityId. The reference is beeing removed when
    // the node is closed/destroyed
    this.addNodeReferenceToHabitatContext()

    // calling the state method will create an initial state object from the 'getDefaultState' method
    // this call is not mandatory but it will ensure that all nodes which are ready have their complete
    // state object for further use
    this.state()
  }

  addNodeReferenceToHabitatContext()
  {
    this.myHabitatContextObject().nodes[this.getEntityId()] = this
  }

  removeNodeReferenceFromHabitatContext()
  {
    delete this.myHabitatContextObject().nodes[this.getEntityId()]
  }

  stateObject()
  {
    if(!this.appNode().getEntityStates()[this.getEntityId()])
        this.appNode().getEntityStates()[this.getEntityId()] = { entity : this.getEntity(), state : this.getDefaultState(), originator : {}, specification : {} }
    return this.appNode().getEntityStates()[this.getEntityId()]
  }

  state()
  {
    return this.stateObject().state
  }

  getDefaultState()
  {
    throw 'Default state is not specified'
  }

  async cleanup()
  {
    await super.cleanup()

    // closing/destroying the node leads to removing the instance from the global context
    this.removeNodeReferenceFromHabitatContext()
  }

}

module.exports = MyHabitatNode_Entity