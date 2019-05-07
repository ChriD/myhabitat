
'use strict'



exports.getEntityIdFromArgs = function(_argv)
{
  return _argv[2]
}


exports.processSetup = function(_process, _adapter)
{
  _process.on('message', function(_inputMessage) {
    _adapter.dataIn(_inputMessage)
    })

  _adapter.on('dataOut', function(_outputMessage) {
    _process.send(_outputMessage)
  })

  process.on('exit', exitHandler.bind(null, {cleanup:true}))
  process.on('close', exitHandler.bind(null, {cleanup:true}))
  process.on('SIGINT', exitHandler.bind(null, {exit:true}))
  process.on('SIGUSR1', exitHandler.bind(null, {exit:true}))
  process.on('SIGUSR2', exitHandler.bind(null, {exit:true}))

  // on uncaught errors the adapter proceses have to close
  // if the watchdog is active, they will be respawned by the main habitat process
  process.on('uncaughtException', function (_err) {
    if(_adapter.getEntityModuleId() != "LOG")
      _adapter.logFatal('An uncaught error occurred: ' + _err.stack)
    else
    {
      console.error('An uncaught error occurred!')
      console.error(_err.stack)
    }
    // no async functions here are allowed, so we can not do a nice cleanup but at least we do try!
    _adapter.close()
    // generate a throw so that the process kills immediately
    throw "KILL PROCESS"
  })

}

function exitHandler(options, exitCode) {
}



