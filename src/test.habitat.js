
const Habitat_App   = require('./habitat-app.js');


console.log("Testing Habitat websocket gateway")

var habitat = new Habitat_App()

habitat.on("log", function(_logType, _log, _data){
  console.log(_log)
})

habitat.init()


setInterval(() => {
  // dummy endless loop
  habitat.closeGateways()
}, 5000)


