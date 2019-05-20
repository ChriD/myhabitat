
'use strict'

const HabitatProcess            = require('./myhabitat.process.adapter.js')
const HabitatAdapter_SystemInfo = require('../adapters/myhabitat.adapter.systeminfo.js')

HabitatProcess.processSetup(process, new HabitatAdapter_SystemInfo(HabitatProcess.getEntityIdFromArgs(process.argv)))
