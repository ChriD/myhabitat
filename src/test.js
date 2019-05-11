"use strict"

var knx = require('knx');
var connection = knx.Connection({
ipAddr          : "10.0.0.130",
ipPort          : 3671,
loglevel        : "trace", // error
 handlers: {
  connected: function() {
    console.log('######################## CONNECTED');
  },
  event: function (evt, src, dest, value) {
  console.log("%s **** KNX EVENT: %j, src: %j, dest: %j, value: %j",
    new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
    evt, src, dest, value);
  }
 }
});

connection.on('disconnected', function(){
    console.log("######################## DISCONNECTED ")
  })


process.stdin.resume()
