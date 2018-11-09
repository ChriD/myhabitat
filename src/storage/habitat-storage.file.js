"use strict"

const Habitat_Storage = require('./habitat-storage.js')
const Path = require('path')
const Fs = require("fs");


/**
 *
 */
class Habitat_Storage_File extends Habitat_Storage
{
  constructor(_path = "")
  {
    super()
    this.defaultPath = _path
  }


  /**
   * this method stores a state
   * @param {string} _storeId the object id where the state will be stored
   * @param {string} _stateId the stateId
   * @param {Object} _state the state object
   * @return {Promise} a promise
   */
  saveState(_objectId, _stateId, _state)
  {
    var self = this

    return new Promise(function(_resolve, _reject){
      try
      {
          if(self.createDirectory(self.defaultPath))
          {
              Fs.writeFileSync(self.defaultPath + self.getFilename(_objectId, _stateId), JSON.stringify(_state))
              _resolve()
          }
      }
      catch(_exception)
      {
          self.logError(_exception.toString())
          _reject()
      }
    })
  }

  /**
   * this method loads a state
   * has to be overwritten
   * @param {string} _objectId the object id where the state will be stored
   * @param {string} _stateId the stateId
   * @return {Object} the object if found, otherwise returns null
   */
  loadState(_objectId, _stateId)
  {
    var self = this

    return new Promise(function(_resolve, _reject){
      try
      {
        var data = Fs.readFileSync(self.defaultPath + self.getFilename(_objectId, _stateId))
        _resolve(JSON.parse(data))
      }
      catch(_exception)
      {
          self.logError(_exception.toString())
          _reject(_exception)
      }
    })
  }

  /**
   * with this method we can create a directory, it will return true if directory was
   * created or is already existent
   * @param {String} _dir the directory which should be created
   * @return {Boolean} true if directory was created or already exists
   */
  createDirectory(_dir)
  {
      try
      {
          Fs.mkdirSync(_dir)
      }
      catch (_exception)
      {
          if (_exception.code !== 'EEXIST')
          {
              this.error(_exception.toString())
              return false
          }
      }
      return true
  }

  /**
   * returns a valid filename from the object and state id
   * @param {String} _objectId
   * @param {String} _stateId
   * @return {String} filename
   */
  getFilename(_objectId, _stateId)
  {
    var filename = _objectId + "_" + _stateId
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".store"
  }

}


module.exports = Habitat_Storage_File