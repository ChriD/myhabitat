
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

  process.on('uncaughtException', function (err) {
    console.error('An uncaught error occurred!')
    console.error(err.stack);
  })

}

function exitHandler(options, exitCode) {
}



