
'use strict'

const HabitatProcess      = require('./myhabitat.process.adapter.js')
const HabitatAdapter_LOG  = require('../adapters/myhabitat.adapter.log.js')

HabitatProcess.processSetup(process, new HabitatAdapter_LOG(HabitatProcess.getEntityIdFromArgs(process.argv)))
