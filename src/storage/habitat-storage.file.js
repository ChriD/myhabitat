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
  * @param {string} _id the id for the storage data
  * @param {Object} _data the storage id
  * @return {Promise} a promise
  */
  save(_id, _data)
  {
    var self = this
    return new Promise(function(_resolve, _reject){
      try
      {
          if(self.createDirectory(self.defaultPath))
          {
              Fs.writeFileSync(self.defaultPath + self.getFilename(_id), JSON.stringify(_data, null, 4), {encoding:'utf8',flag:'w'})
              _resolve()
          }
      }
      catch(_exception)
      {
          self.logError(_exception.toString())
          _reject(_exception)
      }
    })
  }

 /**
   * @param {string} _id the id for the storage data
   * @return {Promise} the object if found, otherwise empty data object
   */
  load(_id, _data)
  {
    var self = this
    return new Promise(function(_resolve, _reject){
      try
      {
        var data = Fs.readFileSync(self.defaultPath + self.getFilename(_id))
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
   * @param {String} _id
   * @return {String} filename
   */
  getFilename(_id)
  {
    var filename = _id
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".store"
  }

}


module.exports = Habitat_Storage_File