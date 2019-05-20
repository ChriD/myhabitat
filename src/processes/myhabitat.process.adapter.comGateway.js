
'use strict'

const HabitatProcess                = require('./myhabitat.process.adapter.js')
const HabitatAdapter_ComGateway     = require('../adapters/myhabitat.adapter.comGateway.js')

HabitatProcess.processSetup(process, new HabitatAdapter_ComGateway(HabitatProcess.getEntityIdFromArgs(process.argv)))

