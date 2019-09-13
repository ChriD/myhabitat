'use strict'

// TODO: allow storage

const MyHabitatAdapter      = require("./myhabitat.adapter.js")
const CloneDeep             = require('lodash.clonedeep')
const Get                   = require('lodash.get')
const Set                   = require('lodash.set')
const MyhabitatStorage_File = require('../storage/myhabitat.storage.file.js')


class MyHabitatAdapter_DataManager extends MyHabitatAdapter
{
  constructor(_entityId)
  {
    super(_entityId)

    this.adapterStateInterval               = 7500

    // this map holds all the different storage instances which was created
    // a storage instance may be a file storage, database storage aso.
    this.storageCollection                  = new Map()

    //this.adapterState.lastStateFile         =  ""
    //this.adapterState.counters              = {}
    //this.adapterState.counters.scenes       = 0
  }


  getEntityModuleId()
  {
    return "DATAMANAGER"
  }


  setup(_configuration)
  {
    const self = this

    //this.adapterState.lastStateFile = _configuration.lastStateFile
    //this.lastStateStorage = new MyhabitatStorage_File(_configuration.lastStateFile ? _configuration.lastStateFile : './data/lastState.json')
    //this.loadScenesData()

    super.setup(_configuration)
  }


  createStorage(_storageType, _storageId, _initParams)
  {
    switch(_storageType.toUpperCase())
    {
      case 'FILE':
        this.storageCollection.set(_storageId, new MyhabitatStorage_File(_initParams))
        break
      default:
        this.logError('Storage type ' + _storageType.toString() + ' not available!')

    }


  }


  storeData(_storageId, _dataEnvelope)
  {
    const storage = this.storageCollection.get(_storageId)
    return storage.save(_dataEnvelope)
  }


  loadData(_storageId, _dataEnvelope)
  {
    const storage = this.storageCollection.get(_storageId)
    return storage.load(_dataEnvelope)
  }


  /*
  async loadLastState()
  {
    // TODO: remove await...
    this.sceneData = await this.lastStateStorage.load('state')
  }

  async saveLastState()
  {
    this.logDebug('Saveing scenes data fo file:' + this.configuration.storageFile)
    await this.storage.save('scenes', this.sceneData)
  }


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
      case "STORE":
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
    this.adapterState.counters.scenes = Object.keys(this.sceneData).length
    this.saveScenesData()
  }


  getSceneData(_sceneId, _entityId = '')
  {
    if(_entityId)
      return Get(this.sceneData,  _sceneId + '.entities.' + _entityId)
    else
      return Get(this.sceneData,  _sceneId)
  }
  */

}


module.exports = MyHabitatAdapter_DataManager