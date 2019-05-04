
'use strict'

const HabitatProcess            = require('./habitat.process.adapter.js')
const HabitatAdapter_Webserver  = require('../adapters/habitat.adapter.webserver.js')

HabitatProcess.processSetup(process, new HabitatAdapter_Webserver(HabitatProcess.getEntityIdFromArgs(process.argv)))
