
'use strict'

const MyHabitatProcess                  = require('./myhabitat.process.adapter.js')
const MyHabitatAdapter_DataManager      = require('../adapters/myhabitat.adapter.dataManager.js')

MyHabitatProcess.processSetup(process, new MyHabitatAdapter_DataManager(MyHabitatProcess.getEntityIdFromArgs(process.argv)))
