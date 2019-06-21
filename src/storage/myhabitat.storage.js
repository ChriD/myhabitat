"use strict"

const EventEmitter  = require("events").EventEmitter


/**
 *
 */
class MyHabitat_Storage extends EventEmitter
{
  constructor()
  {
    super()
  }

  save(_id, _data)
  {
  }

  load(_id)
  {
  }

}


module.exports = MyHabitat_Storage