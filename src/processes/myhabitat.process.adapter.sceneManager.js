
'use strict'

const MyHabitatProcess                  = require('./myhabitat.process.adapter.js')
const MyHabitatAdapter_SceneManager     = require('../adapters/myhabitat.adapter.sceneManager.js')

MyHabitatProcess.processSetup(process, new MyHabitatAdapter_SceneManager(MyHabitatProcess.getEntityIdFromArgs(process.argv)))
