const LogType = Object.freeze({
  "FATAL": 0,
  "ERROR": 10,
  "WARNING": 30,
  "INFO": 40,
  "DEBUG": 50,
  "TRACE": 60
});

class HabitatClient extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.clientUnique = this.generateGuid();
  }

  generateGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  connect(_host) {
    var self = this; //self.connection = new WebSocket('ws://' + document.domain + ':3030')

    self.connection = new WebSocket('ws://localhost:3030');

    self.connection.onopen = function () {
      self.logDebug('Connected to habitat');
    };

    self.connection.onerror = function (_error) {
      self.logDebug('WebSocket Error: ' + JSON.stringify(_error));
      self.connection.close();
    };

    self.connection.onclose = function (_e) {
      self.logDebug('Socket is closed. Reconnect will be attempted in 1 second.', _e.reason);
      setTimeout(function () {
        self.connect(_host);
      }, 1000);
    };

    self.connection.onmessage = function (_e) {
      self.logDebug('Received message from habitat: ' + _e.data);
      self.messageReceived(_e.data);
    };
  }

  close() {
    this.logDebug("Closing habitat client");
    if (this.connection) this.connection.close();
  }

  messageReceived(_habitatMessage) {
    var habitatMessage = JSON.parse(_habitatMessage);

    if (habitatMessage.protocol.toUpperCase() === 'HABITAT_ENTITYSTATE') {
      this.emit('entitystatechanged', habitatMessage.entityId, habitatMessage.entity, {
        path: habitatMessage.path,
        value: habitatMessage.value,
        previousValue: habitatMessage.previousValue
      }, habitatMessage.state, habitatMessage.originator, habitatMessage.specification);
    }
  }
  /*
    updateHabitatNodeStateForElement(_element, _state = null)
  {
    var envelope = {}
      // pack the current state into a data envelope and send it to all clients
    envelope.protocol     = "HABITAT_ENVELOPE"
    envelope.version      = 1
    envelope.sender       = "HABITAT MOBILE"
    envelope.senderUnique = this.clientUnique
    envelope.nodeId       = _element.getAttribute('habitat-id')
    envelope.originator   = {
                              objectUnique : _element.getAttribute('habitat-unique'),
                              clientUnique : this.clientUnique
                            }
    envelope.type         = "NODESTATE"
    if(_state)
      envelope.data       =  JSON.parse(JSON.stringify(_state))
    else
      envelope.data       =  JSON.parse(JSON.stringify(_element.habitatState))
      if(this.connection)
      this.connection.send(JSON.stringify(envelope))
  }
  */


  log(_type, _log, _object) {
    console.log('[HABITAT] ' + _log);
  }

  logError(_log, _object) {
    this.log(LogType.ERROR, _log, _object);
  }

  logWarning(_log, _object) {
    this.log(LogType.WARNING, _log, _object);
  }

  logInfo(_log, _object) {
    this.log(LogType.INFO, _log, _object);
  }

  logDebug(_log, _object) {
    this.log(LogType.DEBUG, _log, _object);
  }

  logTrace(_log, _object) {
    this.log(LogType.TRACE, _log, _object);
  }

} // ---------------------


var habitatClient = new HabitatClient(); /// -------------------

window.onbeforeunload = function () {
  habitatClient.close();
};

window.addEventListener("unload", function () {
  habitatClient.close();
});
document.addEventListener("unload", function () {
  habitatClient.close();
});