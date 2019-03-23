
"use strict"

const Habitat_Node  = require('../habitat-node.js')


class Habitat_Node_Common extends Habitat_Node
{
  constructor(_RED, _config)
  {
    super(_RED, _config)
  }

  /**
   * @return {String}
   */
  getModuleId()
  {
    return "COMMON"
  }

  /**
   * @return {String}
   */
  getNodeId()
  {
    return this.config.name;
  }

}

module.exports = Habitat_Node_Common