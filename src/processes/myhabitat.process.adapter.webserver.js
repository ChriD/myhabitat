
'use strict'

const MyHabitatProcess            = require('./myhabitat.process.adapter.js')
const MyHabitatAdapter_Webserver  = require('../adapters/myhabitat.adapter.webserver.js')

MyHabitatProcess.processSetup(process, new MyHabitatAdapter_Webserver(MyHabitatProcess.getEntityIdFromArgs(process.argv)))
