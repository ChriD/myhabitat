
'use strict'

const HabitatProcess      = require('./habitat.process.adapter.js')
const HabitatAdapter_KNX  = require('../adapters/habitat.adapter.knx.js')

HabitatProcess.processSetup(process, new HabitatAdapter_KNX(HabitatProcess.getEntityIdFromArgs(process.argv)))

