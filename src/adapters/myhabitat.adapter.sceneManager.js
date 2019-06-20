'use strict'

const MyHabitatAdapter  = require("./myhabitat.adapter.js")
const CloneDeep         = require('lodash.clonedeep')
const Get               = require('lodash.get')
const Set               = require('lodash.set')
const fs                = require("fs");


class MyHabitatAdapter_SceneManager extends MyHabitatAdapter
{
  constructor(_entityId)
  {
    super(_entityId)

    this.adapterStateInterval       = 7500
    //this.adapterStateOutputEnabled  = false

    this.adapterState.storageFile         = ""
    this.adapterState.counters = {}
    this.adapterState.counters.scenes     = 0


    // 'multi dimensional' object storing the sceneId and the entities with its states
    this.sceneData = {}
  }


  getEntityModuleId()
  {
    return "SCENEMANAGER"
  }


  setup(_configuration)
  {
    const self = this

    this.adapterState.storageFile = _configuration.storageFile
    // on setup we are loading the scenes from the file storage into our data object
    // the data object will be saved from timne to time if there was a change
    //self.loadScenesFromFile(_configuration.storageFile)

    // https://www.npmjs.com/package/data-store
    // https://www.npmjs.com/package/node-storage

    super.setup(_configuration)
  }


  //createFileIfNotExists()


  /*
  loadScenesFromFile(_filename)
  {

  }
  */


  close()
  {
    super.close()
  }


  input(_data)
  {
    _data.action = _data.action ? _data.action.toUpperCase() : "LOAD"

    switch(_data.action)
    {
      case "LOAD":
        this.loadScene(_data.sceneId, _data.entityId)
        break
      case "SET":
        this.setSceneData(_data.sceneId, _data.entityId, _data.data)
        break
      default:
        this.logError('Action \'' + _data.action + '\' not found!')
    }
  }


  loadScene(_sceneId, _entityId = '')
  {
    this.logInfo('Load scene with id: ' + _sceneId + (_entityId ? (' for entity: ' + _entityId) : '' ))

    // lookup the scene id, if we have none, then give some errors
    const sceneData = this.getSceneData(_sceneId, _entityId)
    if(!sceneData || !sceneData.entities)
    {
      this.logError('No scene for id \'' + _sceneId + '\' found' + (_entityId ? (' for entity: ' + _entityId) : ',' )  + ' or it does not have any entities attached!')
      return
    }

    // send back the stored state to the main habitat process
    const keys = Object.keys(sceneData.entities)
    for(var idx=0; idx<keys.length; idx++)
    {
      this.outputRawData({ entity : { id: keys[idx] }, entityState : sceneData.entities[keys[idx]] })
    }
  }


  setSceneData(_sceneId, _entityId, _data)
  {
    if(_entityId)
      Set(this.sceneData, _sceneId + '.entities.' + _entityId, _data)
    else
      Set(this.sceneData, _sceneId + '.entities', _data)
  }


  getSceneData(_sceneId, _entityId = '')
  {
    if(_entityId)
      return Get(this.sceneData,  _sceneId + '.entities.' + _entityId)
    else
      return Get(this.sceneData,  _sceneId)
  }

}


module.exports = MyHabitatAdapter_SceneManager