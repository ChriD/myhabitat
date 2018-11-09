
const WebSocket         = require('ws');


console.log("Testing Habitat Client connection")


const ws1 = new WebSocket('http://localhost:3030')
const ws2 = new WebSocket('http://localhost:3030')


ws1.on('open', function open() {
  ws1.send('Hello i am WS-1')
})
ws1.on('message', function incoming(data) {
  console.log("WS1" + data)
})

ws2.on('open', function open() {
  ws2.send('Hello i am WS-2')
})
ws2.on('message', function incoming(data) {
  console.log("WS2" + data)
})

