// https://nodered.org/docs/creating-nodes/node-js

"use strict"


class HabitatNode
{
  constructor(_RED, _config)
  {
    const self = this

    self.RED          = _RED
    self.config       = _config
    self.isReady      = false

    //_RED.events.setMaxListeners(100)
    _RED.events.once('nodes-started', function() { self.allNodesStarted() })

    // input events from the gui a redirected to the main input method of the instance
    // this input method will be called by the habitat app to id there comes a message
    // from the gateway adapter
    self.on('input', function(_message){
        if(self.isReady)
          self.input(_message)
    })

  }

  ready()
  {
    this.isReady = true
  }


  created()
  {
    const self = this
    self.on('close', function(_removed){ self.close(_removed) })
  }


  input(_message)
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


  updateNodeInfoStatus()
  {
  }

}

module.exports = HabitatNode