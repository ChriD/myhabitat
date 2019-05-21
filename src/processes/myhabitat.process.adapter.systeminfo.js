
'use strict'

const MyHabitatProcess            = require('./myhabitat.process.adapter.js')
const MyHabitatAdapter_SystemInfo = require('../adapters/myhabitat.adapter.systeminfo.js')

MyHabitatProcess.processSetup(process, new MyHabitatAdapter_SystemInfo(MyHabitatProcess.getEntityIdFromArgs(process.argv)))
