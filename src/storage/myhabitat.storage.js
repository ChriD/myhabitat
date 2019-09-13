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

  save(_dataEnvelope)
  {
    // should return a promise!
  }

  load(_dataEnvelope = {})
  {
    // should return a promise!
  }

}


module.exports = MyHabitat_Storage