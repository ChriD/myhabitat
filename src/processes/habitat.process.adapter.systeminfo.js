
'use strict'

const HabitatProcess            = require('./habitat.process.adapter.js')
const HabitatAdapter_SystemInfo = require('../adapters/habitat.adapter.systeminfo.js')

HabitatProcess.processSetup(process, new HabitatAdapter_SystemInfo(HabitatProcess.getEntityIdFromArgs(process.argv)))
