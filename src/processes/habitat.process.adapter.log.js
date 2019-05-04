
'use strict'

const HabitatProcess      = require('./habitat.process.adapter.js')
const HabitatAdapter_LOG  = require('../adapters/habitat.adapter.log.js')

HabitatProcess.processSetup(process, new HabitatAdapter_LOG(HabitatProcess.getEntityIdFromArgs(process.argv)))
