
'use strict'

const HabitatProcess            = require('./myhabitat.process.adapter.js')
const HabitatAdapter_Webserver  = require('../adapters/myhabitat.adapter.webserver.js')

HabitatProcess.processSetup(process, new HabitatAdapter_Webserver(HabitatProcess.getEntityIdFromArgs(process.argv)))
