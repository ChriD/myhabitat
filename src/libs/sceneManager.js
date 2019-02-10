
"use strict"

const EventEmitter = require("events").EventEmitter;

class SceneManager extends EventEmitter
{
  constructor()
  {
    super()
    // a named multidimensional array for the scene data storage
    // first level is sceneId, second level is nodeId nd third level is the state/scene object
    this.sceneData = []
  }

  /**
   * deep-copy a object
   * @param {Object} _object the object to copy
   * @return {Object} a copy of the object
   */
  copyObject(_object)
  {
    if(_object)
      return JSON.parse(JSON.stringify(_object))
    return null
  }


  setSceneData(_sceneId, _nodeId, _data)
  {
    if(!this.sceneData[_sceneId])
        this.sceneData[_sceneId] = []
    if(!_nodeId)
        this.sceneData[_sceneId] = this.copyObject(_data)
    if(!this.sceneData[_sceneId][_nodeId])
        this.sceneData[_sceneId][_nodeId] = this.copyObject(_data)
  }


  getSceneData(_sceneId, _nodeId = "")
  {
    if(!this.sceneData[_sceneId])
        return null
    if(!_nodeId)
        return this.sceneData[_sceneId]
    if(!this.sceneData[_sceneId][_nodeId])
        return null
    return this.sceneData[_sceneId][_nodeId]
  }

}



module.exports = SceneManager