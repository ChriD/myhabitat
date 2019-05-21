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
  }


  created()
  {
    const self = this
    // input events from the gui a redirected to the main input method of the instance
    // this input method will be called by the habitat app to id there comes a message
    // from the gateway adapter
    self.on('input', function(_message){
      if(self.isReady)
        self.input(_message)
    })

    self.on('close', function(_removed){
      self.close(_removed)
    })
  }

  ready()
  {
    this.isReady = true
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


  myHabitatContextObject()
  {
    let habitat = this.context().global.get('MYHABITAT')
    if(!habitat)
    {
      this.context().global.set('MYHABITAT', {  nodes : {} } )
      habitat = this.context().global.get('MYHABITAT')
    }
    return habitat
  }

  /**
   * returns the habitat application node
   * @return {Object} the habitat application node
   */
  appNode()
  {
    return this.myHabitatContextObject().nodes['MYHABITATAPP']
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