"use strict"

const HabitatNode_Entity   = require('./habitat.node.entity.js')

class HabitatNode_Adapter extends HabitatNode_Entity
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

  allNodesStarted()
  {
      super.allNodesStarted()
      // when all nodes are started we can be sure that the habitat node is ready
      // then we can register the adapter
      this.habitatAppNode().registerAdapter(this.getAdapterProcessFile(), this.getEntityId(), this.getAdapterConfiguration())
  }

  async cleanup()
  {
    await super.cleanup()
    // on close/cleanup we have to wait until the adapter was unregistered, so we do return a
    // promise that will resolve if the adapter was closed nad cleaned up its stuff
    return this.habitatAppNode().unregisterAdapter(this.getEntityId())
  }

}


module.exports = HabitatNode_Adapter