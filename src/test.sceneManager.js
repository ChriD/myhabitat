
const SceneManager   = require('./libs/sceneManager.js')


console.log("Testing Scene manager")

var sceneManager = new SceneManager()
sceneManager.setSceneData("NIGHT", "ID001", { "isOn" :true })
sceneManager.setSceneData("ALARM", "ID001", { "isOn" :true })
sceneManager.setSceneData("ALARM", "ID002", { "isOn" :true })
var data = sceneManager.getSceneData("NIGHT", "NODEID")
console.log(JSON.stringify(data))


