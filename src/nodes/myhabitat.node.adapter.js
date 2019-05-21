"use strict"

const MyHabitatNode_Entity   = require('./myhabitat.node.entity.js')

class MyHabitatNode_Adapter extends MyHabitatNode_Entity
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
  }

  getAdapterConfiguration()
  {
    throw "Adapter configuration is not specified"
  }

  getAdapterProcessFile()
  {
    throw "Adapter process file is not specified"
  }

  adapterProcess()
  {
    return this.appNode().getAdapterProcess(this.getEntityId())
  }

  getDefaultState()
  {
    return {}
  }

  getEntityId()
  {
    return this.config.adapterId
  }

  allNodesStarted()
  {
      super.allNodesStarted()
      // when all nodes are started we can be sure that the habitat node is ready
      // then we can register the adapter
      this.appNode().registerAdapter(this.getAdapterProcessFile(), this.getEntityId(), this.getAdapterConfiguration())
  }

  async cleanup()
  {
    await super.cleanup()
    // on close/cleanup we have to wait until the adapter was unregistered, so we do return a
    // promise that will resolve if the adapter was closed nad cleaned up its stuff
    return this.appNode().unregisterAdapter(this.getEntityId())
  }

  adapterMessage(_adapterEntity, _data)
  {
  }

  adapterState(_adapterEntity, _state)
  {
  }

}


module.exports = MyHabitatNode_Adapter