"use strict"

const MyHabitat_Storage = require('./myhabitat.storage.js')
const Path              = require('path')
const Fs                = require("fs")



class MyHabitat_Storage_File extends MyHabitat_Storage
{
  constructor(_storageFilename = '')
  {
    super()
    this.storageFilename = _storageFilename
  }


  save(_id, _data)
  {
    var self = this
    return new Promise(function(_resolve, _reject){
      try
      {
        console.log("SAV: " + self.storageFilename)
          if(self.createDirectory(self.getDirectoryFromFileName(self.storageFilename)))
          {
            console.log("Sync: " + self.storageFilename)
              Fs.writeFileSync(self.storageFilename, JSON.stringify(_data, null, 4), {encoding:'utf8',flag:'w'})
              _resolve()
          }
          else
          {
            console.log('ERR: directpry')
          }
      }
      catch(_exception)
      {
        _reject(_exception)
      }
    })
  }


  load(_id, _data)
  {
    var self = this
    return new Promise(function(_resolve, _reject){
      try
      {
        var data = Fs.readFileSync(self.storageFilename)
        _resolve(JSON.parse(data))
      }
      catch(_exception)
      {
        if (_exception.code !== 'ENOENT')
        {
          _reject(_exception)
        }
        _resolve({})
      }
    })
  }

  /**
   * with this method we can create a directory, it will return true if directory was created or is already existent
   * @param {String} _dir the directory which should be created
   * @return {Boolean} true if directory was created or already exists
   */
  createDirectory(_dir)
  {
      if(_dir === '')
        return true

      try
      {
          Fs.mkdirSync(_dir)
      }
      catch (_exception)
      {
          if (_exception.code !== 'EEXIST')
          {
              return false
          }
      }
      return true
  }


  getDirectoryFromFileName(_filename)
  {
    return Path.dirname(_filename)
  }

}


module.exports = MyHabitat_Storage_File