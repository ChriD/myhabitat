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
    self.on('close', function(_removed, _done){ self.close(_removed, _done) })
  }


  close(_removed)
  {
    return new Promise(function(_resolve, _reject) { _resolve() })
  }

  /**
   * should return a ID where the habitat application node instance is stored in the global context
   * @return {string} the id of the context storage
   */
  getHabitatAppNodeContextId()
  {
    return "HABITATAPPNODE"
  }

  /**
   * returns the habitat application node
   * @return {Object} the habitat application node
   */
  habitatAppNode()
  {
    return this.context().global.get(this.getHabitatAppNodeContextId())
  }


  allNodesStarted()
  {
  }

}

module.exports = HabitatNode