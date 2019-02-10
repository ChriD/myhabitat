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
   * @param {string} _storeId the object id where the state will be stored
   * @param {string} _stateId the stateId
   * @param {Object} _state the state object
   * @return {Promise} true when save was ok
   */
  saveState(_objectId, _stateId, _state)
  {
  }

  /**
   * this method loads a state
   * has to be overwritten
   * @param {string} _storeId the object id where the state will be stored
   * @param {string} _stateId the stateId
   * @return {Promise} true when save was ok
   */
  loadState(_storeId, _stateId)
  {
  }
}


module.exports = Habitat_Storage