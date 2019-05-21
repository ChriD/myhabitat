
'use strict'

const MyHabitatProcess      = require('./myhabitat.process.adapter.js')
const MyHabitatAdapter_LOG  = require('../adapters/myhabitat.adapter.log.js')

MyHabitatProcess.processSetup(process, new MyHabitatAdapter_LOG(MyHabitatProcess.getEntityIdFromArgs(process.argv)))
