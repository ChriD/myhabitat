
'use strict'

const MyHabitatProcess                = require('./myhabitat.process.adapter.js')
const MyHabitatAdapter_ComGateway     = require('../adapters/myhabitat.adapter.comGateway.js')

MyHabitatProcess.processSetup(process, new MyHabitatAdapter_ComGateway(MyHabitatProcess.getEntityIdFromArgs(process.argv)))

