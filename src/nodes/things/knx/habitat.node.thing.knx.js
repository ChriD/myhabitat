"use strict"

const HabitatNode_Thing   = require('../../habitat.node.thing.js')

class HabitatNode_Thing_KNX extends HabitatNode_Thing
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
    this.observedGA = []
  }


  getEntityModuleId()
  {
    return "KNX"
  }


  created()
  {
    const self = this
    super.created()
    // be sure we get all messages the knx adapter was subscribed to listen to
    // those messages may not all belong to the specific node instance, so we have to filter out the appropriate KNX messages
    this.adapterNode().on('knxMessage', function(_data){
      if(self.observedGA.includes(_data.destination))
        self.gaReceived(_data.destination, _data.value, _data)
    })
  }


  observeGA(_ga, _dpt = 'DPT1.001')
  {
    // KNX nodes have to tell the adapter which GA's they want to observe, due that the adapter does not distinguish
    // which node has observed what GA (and therfore senda all GA's to all KNX nodes) we have to store the observed GA
    // for the node locally
    this.adapterNode().observeGA(_ga, _dpt)
    this.observedGA.push(_ga)
  }


  sendGA(_ga, _dpt, _value)
  {
    this.adapterNode().sendGA(_ga, _dpt, _value)
  }


  gaReceived(_ga, _value, _data)
  {
  }

}


module.exports = HabitatNode_Thing_KNX