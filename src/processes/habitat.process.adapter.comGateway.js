
'use strict'

const HabitatProcess                = require('./habitat.process.adapter.js')
const HabitatAdapter_ComGateway     = require('../adapters/habitat.adapter.comGateway.js')

HabitatProcess.processSetup(process, new HabitatAdapter_ComGateway(HabitatProcess.getEntityIdFromArgs(process.argv)))

