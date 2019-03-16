"use strict"

const Habitat_Base = require('../habitat-base.js')


/**
 *
 */
class Habitat_Storage extends Habitat_Base
{
  constructor()
  {
    super()
  }

  /**
   * this method stores a state
   * has to be overwritten
   * @param {string} _id the id for the storage data
   * @param {Object} _data the state object
   * @return {Promise} a promise which will resolve if save was ok
   */
  save(_id, _data)
  {
  }

  /**
   * this method loads a state
   * has to be overwritten
   * @param {string} _id the id for the storage data
   * @return {Promise} a promise with the stored data as parameter, if there is no data the parameter will be null
   */
  load(_id)
  {
  }
}


module.exports = Habitat_Storage