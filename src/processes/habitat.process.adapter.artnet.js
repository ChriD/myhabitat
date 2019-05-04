
'use strict'

const HabitatProcess          = require('./habitat.process.adapter.js')
const HabitatAdapter_ARTNET   = require('../adapters/habitat.adapter.artnet.js')

HabitatProcess.processSetup(process, new HabitatAdapter_ARTNET(HabitatProcess.getEntityIdFromArgs(process.argv)))