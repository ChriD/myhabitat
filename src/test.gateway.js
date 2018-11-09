
const WebSocket         = require('ws');
const Habitat_Gateway   = require('./habitat-gateway.websocket.js');


console.log("Testing Habitat websocket gateway")

var gateway = new Habitat_Gateway()
gateway.run()

gateway.on("log", function(_type, _log, _data){
  console.log("GATEWAY: " + _log)
})

gateway.on("clientConnected", function(_clientInfo){
  console.log("Client connected " + _clientInfo.id )
})

gateway.on("clientMessageReceived", function(_clientInfo, _message){
  console.log("Received from client " + _clientInfo.id + ": " + _message )
})


setTimeout(function(){
  gateway.send("Hello my dear friends!");
}, 1000);


const ws1 = new WebSocket('http://localhost:3030')
const ws2 = new WebSocket('http://localhost:3030')
const ws3 = new WebSocket('http://localhost:3030')

ws1.on('open', function open() {
  ws1.send('Hello i am WS-1')
})
ws1.on('message', function incoming(data) {
  console.log(data);
});

ws2.on('open', function open() {
  ws2.send('Hello i am WS-2')
})
ws2.on('message', function incoming(data) {
  console.log(data);
});

ws3.on('open', function open() {
  ws3.send('Hello i am WS-3')
})
ws3.on('message', function incoming(data) {
  console.log(data);
});

