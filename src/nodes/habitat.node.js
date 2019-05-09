// https://nodered.org/docs/creating-nodes/node-js

"use strict"


class HabitatNode
{
  constructor(_RED, _config)
  {
    const self = this

    self.RED          = _RED
    self.config       = _config

    //_RED.events.setMaxListeners(100)
    _RED.events.once('nodes-started', function() { self.allNodesStarted() })

  }


  created()
  {
    const self = this
    self.on('close', function(_removed){ self.close(_removed) })
  }

  ready()
  {
  }

  async cleanup()
  {
  }

  close(_removed)
  {
    return this.cleanup()
  }


  habitatContextObject()
  {
    let habitat = this.context().global.get('HABITAT')
    if(!habitat)
    {
      this.context().global.set('HABITAT', {  nodes : {} } )
      habitat = this.context().global.get('HABITAT')
    }
    return habitat
  }

  /**
   * returns the habitat application node
   * @return {Object} the habitat application node
   */
  habitatAppNode()
  {
    return this.habitatContextObject().nodes['HABITATAPP']
  }


  allNodesStarted()
  {
    this.ready()
  }

}

module.exports = HabitatNode