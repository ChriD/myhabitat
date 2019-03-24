/**
 *
 */
module.exports = function(RED) {

    "use strict"

    const Habitat_Node_Thing_KNX = require('./habitat-node.thing.knx.js')
    const util = require("util");
    const vm = require("vm")


    class Habitat_Node_Thing_KNX_GaFilter extends Habitat_Node_Thing_KNX
    {
      constructor(_config)
      {
        super(RED, _config)

        var self = this

        self.groupAddressFilter.push(self.config.gaToFilter)

        self.func   = _config.func
        self.script = null
        self.functionText =
          "var results = null;"+
          "results = (function(msg){ "+
            "var __msgid__ = msg._msgid;"+
            "var node = {"+
                "id:__node__.id,"+
                "name:__node__.name,"+
                "log:__node__.log,"+
                "error:__node__.error,"+
                "warn:__node__.warn,"+
                "debug:__node__.debug,"+
                "trace:__node__.trace,"+
                "on:__node__.on,"+
                "status:__node__.status,"+
                "send:function(msgs){ __node__.send(__msgid__,msgs);}"+
            "};\n"+
            self.func+"\n"+
          "})(msg);";

        RED.nodes.createNode(self, _config)

        // we have to call the created event for some stuff which will be done in the base class
        // this is a 'have to'!
        self.created()
      }

      /**
       * should return true if the node does have a state object
       * @return {boolean} state enbaled or disabled
       */
      stateStorageEnabled()
      {
        return false
      }

      /**
       * returns the knx adapter node
       * @param {string} _source the knx device id/address
       * @param {string} _destination the knx group address
       * @param {string} _value the value of the message
       * @param {Object} _valueObject the knx object value
       */
      knxDataReceived(_source, _destination, _value, _valueObject)
      {
        try
        {
            var context = this.createContextForScript()
            context.msg = {payload :_value }
            this.script = vm.createScript(this.functionText, {
                filename: 'Function node:'+this.id+(this.name?' ['+this.name+']':''),
                displayErrors: true
            })
            this.script.runInContext(context)
            this.sendResults(this,"",context.results)
        }
        catch(_exception)
        {
            this.logError("Fehler: " + _exception.message, _exception)
        }


        //this.send({payload :_value })

        this.lastReceived = {
          "value"   : _value,
          "source"  : _source
        }
        this.updateNodeInfoState()
      }


      createContextForScript()
      {
        var sandbox = this.createSandbox()
        var context = vm.createContext(sandbox)
        return context
      }


      createSandbox()
      {
        var node = this
        return {
            console:console,
            util:util,
            Buffer:Buffer,
            Date: Date,
            RED: {
                util: RED.util
            },
            __node__: {
                id: node.id,
                name: node.name,
                log: function() {
                    node.log.apply(node, arguments);
                },
                error: function() {
                    node.error.apply(node, arguments);
                },
                warn: function() {
                    node.warn.apply(node, arguments);
                },
                debug: function() {
                    node.debug.apply(node, arguments);
                },
                trace: function() {
                    node.trace.apply(node, arguments);
                },
                send: function(id, msgs) {
                    node.sendResults(node, id, msgs);
                },
                on: function() {
                    if (arguments[0] === "input") {
                        throw new Error(RED._("function.error.inputListener"));
                    }
                    node.on.apply(node, arguments);
                },
                status: function() {
                    node.status.apply(node, arguments);
                }
            },
            context: {
                set: function() {
                    node.context().set.apply(node,arguments);
                },
                get: function() {
                    return node.context().get.apply(node,arguments);
                },
                keys: function() {
                    return node.context().keys.apply(node,arguments);
                },
                get global() {
                    return node.context().global;
                },
                get flow() {
                    return node.context().flow;
                }
            },
            flow: {
                set: function() {
                    node.context().flow.set.apply(node,arguments);
                },
                get: function() {
                    return node.context().flow.get.apply(node,arguments);
                },
                keys: function() {
                    return node.context().flow.keys.apply(node,arguments);
                }
            },
            global: {
                set: function() {
                    node.context().global.set.apply(node,arguments);
                },
                get: function() {
                    return node.context().global.get.apply(node,arguments);
                },
                keys: function() {
                    return node.context().global.keys.apply(node,arguments);
                }
            },
            env: {
                get: function(envVar) {
                    var flow = node._flow;
                    return flow.getSetting(envVar);
                }
            },
            setTimeout: function () {
                var func = arguments[0];
                var timerId;
                arguments[0] = function() {
                    sandbox.clearTimeout(timerId);
                    try {
                        func.apply(this,arguments);
                    } catch(err) {
                        node.error(err,{});
                    }
                };
                timerId = setTimeout.apply(this,arguments);
                node.outstandingTimers.push(timerId);
                return timerId;
            },
            clearTimeout: function(id) {
                clearTimeout(id);
                var index = node.outstandingTimers.indexOf(id);
                if (index > -1) {
                    node.outstandingTimers.splice(index,1);
                }
            },
            setInterval: function() {
                var func = arguments[0];
                var timerId;
                arguments[0] = function() {
                    try {
                        func.apply(this,arguments);
                    } catch(err) {
                        node.error(err,{});
                    }
                };
                timerId = setInterval.apply(this,arguments);
                node.outstandingIntervals.push(timerId);
                return timerId;
            },
            clearInterval: function(id) {
                clearInterval(id);
                var index = node.outstandingIntervals.indexOf(id);
                if (index > -1) {
                    node.outstandingIntervals.splice(index,1);
                }
            }
        }
      }


      sendResults(node,_msgid,msgs) {
        if (msgs == null) {
            return;
        } else if (!util.isArray(msgs)) {
            msgs = [msgs];
        }
        var msgCount = 0;
        for (var m=0; m<msgs.length; m++) {
            if (msgs[m]) {
                if (!util.isArray(msgs[m])) {
                    msgs[m] = [msgs[m]];
                }
                for (var n=0; n < msgs[m].length; n++) {
                    var msg = msgs[m][n];
                    if (msg !== null && msg !== undefined) {
                        if (typeof msg === 'object' && !Buffer.isBuffer(msg) && !util.isArray(msg)) {
                            msg._msgid = _msgid;
                            msgCount++;
                        } else {
                            var type = typeof msg;
                            if (type === 'object') {
                                type = Buffer.isBuffer(msg)?'Buffer':(util.isArray(msg)?'Array':'Date');
                            }
                            node.error(RED._("function.error.non-message-returned",{ type: type }));
                        }
                    }
                }
            }
        }
        if (msgCount>0) {
            node.send(msgs);
        }
    }


      updateNodeInfoState()
      {
        super.updateNodeInfoState();
        let infoText = this.lastReceived.source + " -> " + this.lastReceived.value
        this.status({text: infoText})
      }

    }


    RED.nodes.registerType("habitat-node-thing-knx-gafilter", Habitat_Node_Thing_KNX_GaFilter)
  }
