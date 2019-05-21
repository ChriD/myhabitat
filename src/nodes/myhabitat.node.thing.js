"use strict"

const MyHabitatNode_Entity   = require('./myhabitat.node.entity.js')

class MyHabitatNode_Thing extends MyHabitatNode_Entity
{
  constructor(_RED, _config)
  {
    super(_RED, _config)

     // a thing often has an adapter, so if we have one, store the adapter entity id to the config object
     if(this.config.adapterNode)
     {
       const adapterNode = this.RED.nodes.getNode(this.config.adapterNode)
       if(adapterNode)
         this.config.adapterId = adapterNode.getEntityId()
     }
  }

  adapterNode()
  {
    if(!this.RED.nodes.getNode(this.config.adapterNode))
      this.error('Adapter node for ' + this.config.adapterId + ' not found')
    return this.RED.nodes.getNode(this.config.adapterNode)
  }

}


module.exports = MyHabitatNode_Thing