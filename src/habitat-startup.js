"use strict"

const Habitat       = require("./habitat.js")
const LogLevel      = require("./globals/habitat.global.log.js").LogLevel



const habitat = new Habitat()

habitat.init({
  logger: {
            logLevel: LogLevel.TRACE
          },
  adapterProcessWatchdog :  {
                              enabled: true
                            }
})

habitat.registerAdapter('knx.js', 'KNX001', { host : "10.0.0.130", port : 3671, forceTunneling : false })
habitat.registerAdapter('artnet.js', 'ARTNET001', { host : "10.0.0.125", port : 6454, universe : 0, refresh : 4000 })

/*
habitat.getAdapterProcess('KNX001').send( {data : { action    : "observe",
                                                    ga        : "7/2/1",
                                                    options   : {
                                                                  dpt : "DPT9.001"
                                                                },
                                                  }
                                          })

habitat.getAdapterProcess('KNX001').send( {data : { action    : "observe",
                                                    ga        : "7/2/2",
                                                    options   : {
                                                                  dpt : "DPT9.001"
                                                                },
                                                  }
                                          })

habitat.getAdapterProcess('KNX001').send( {data : { action    : "observeAll",
                                                    options   : {},
                                                  }
                                          })

*/

/*

setTimeout(function(){

  habitat.updateEntityState("TEST001", { a: 1, b: 2}, { id: "ORIG1" } )
  habitat.updateEntityState("TEST001", { b: 7, c: 3} )
  habitat.updateEntityState("TEST001", { b: 7, c: 4, obj : { test: 'XXXX' }}, { id: "ORIG2" } )
  habitat.updateEntityState("TEST001", { b: 7, c: 4, obj : { test: 'XXXX2' }}, { id: "ORIG2" } )

}, 10000)
*/






                                          /*
habitat.getAdapterProcess('ARTNET001').send( {data :  { action    : "fadeTo",
                                                        channel   : 11,
                                                        value     : 100,
                                                        fadeTime  : 350
                                                      }
                                          })

habitat.getAdapterProcess('ARTNET001').send( {data :  { action    : "fadeTo",
                                                        channel   : 3,
                                                        value     : 100
                                                      }
                                          })

habitat.getAdapterProcess('ARTNET001').send( {data :  { action    : "fadeTo",
                                                        channel   : 52,
                                                        value     : 80
                                                      }
                                          })

habitat.getAdapterProcess('ARTNET001').send( {data :  { action    : "fadeTo",
                                                        channel   : 52,
                                                        value     : 120
                                                      }
                                          })
                                          */


habitat.on("adapterState", function(_adapterEntity, _adapterState){
  //console.log("{" + _adapterEntity.id + "} : " + JSON.stringify(_adapterState))
})


process.stdin.resume()




/////////////////

function exitHandler(options, exitCode) {
  if(options.exit)
    habitat.close()

  setTimeout(function(){ // set timout doesnt work?!
      if (options.exit) process.exit()
  }, 2000);

}

process.on('exit', exitHandler.bind(null,{cleanup:true}))
process.on('SIGINT', exitHandler.bind(null, {exit:true}))
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}))
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}))