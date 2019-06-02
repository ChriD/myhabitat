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
    //throw "Entity-Module is not specified"
    return ''
  }

  getEntityId()
  {
    //if(!this.config.entityId)
      //throw "Entity-ID is not specified"
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

  input(_message)
  {
    super.input(_message)

      // the state object may be given in the payload too, so if this is the case, copy the payload state
      // to the message state (if message state is not there!)
      if(!_message.state)
      {
        if(_message.payload.state && typeof _message.payload.state == "object")
          _message.state = JSON.parse(JSON.stringify(_message.payload.state))
        else
          _message.state = {}
      }

      // fill up the given message state object with all values we need, that means the state object given by the
      // input will be merged with the current state object so we do have all of the properties existent
      this.prepareInputState(_message.state)
  }

  addNodeReferenceToHabitatContext()
  {
    if(this.getEntityId())
      this.myHabitatContextObject().nodes[this.getEntityId()] = this
  }

  removeNodeReferenceFromHabitatContext()
  {
    if(this.getEntityId())
      delete this.myHabitatContextObject().nodes[this.getEntityId()]
  }


  stateObject()
  {
    if(!this.getEntityId())
      return { entity : {}, state : {}, originator : {}, specification : {}}
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


  prepareInputState(_inputState, _state = this.state())
  {
    if(!_inputState)
      _inputState = {}

    for (var property in _state)
    {
      if (_state.hasOwnProperty(property))
      {
        if(_state[property] instanceof Object)
        {
          if (!_inputState.hasOwnProperty(property))
            _inputState[property] = {}
          this.prepareInputState(_inputState[property], _state[property])
        }
        else
        {
          _inputState[property] = _inputState.hasOwnProperty(property)   ? _inputState[property]  : _state[property]
        }
      }
    }
  }

  async cleanup()
  {
    await super.cleanup()

    // closing/destroying the node leads to removing the instance from the global context
    this.removeNodeReferenceFromHabitatContext()
  }

}

module.exports = MyHabitatNode_Entity