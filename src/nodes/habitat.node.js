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


  close(_removed, _done)
  {
    _done()
  }


  allNodesStarted()
  {
  }

}

module.exports = HabitatNode