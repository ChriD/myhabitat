// https://github.com/node-red/node-red/wiki/API-Reference
// https://nodered.org/docs/creating-nodes/status


module.exports = function(RED) {

    "use strict"

    const Path          = require('path')
    const Habitat_Node  = require('./habitat-node.js')
    const Habitat_App   = require('./habitat-app.js')

    class Habitat_Node_App extends Habitat_Node
    {
        constructor(_config)
        {

            super(RED, _config)

            var self = this

            RED.nodes.createNode(self, _config);

            self.log("Starting habitat")

            // create the habitat app
            self.habitat = new Habitat_App()
            // the habitat instance should log to the node-red output
            self.habitat.on("log", function(_logType, _log, _data){ self.log(_log) })
            // update some default path for several m,odules
            self.habitat.storage.defaultPath    = Path.join(RED.settings.userDir, "habitat\\states") + "\\"
            self.habitat.guiServer.defaultPath  = Path.join(RED.settings.userDir, "habitat\\webclients") + "\\"

            self.habitat.init()

            //
            self.on('input', function(){ self.onInput() })
            self.on('close', function(){ self.onClose() })

            // we have to store this instance to the global context so every habitat child node
            // does have access to it
            self.context().global.set(self.getHabitatGlobalContextId(), self)
        }


        close()
        {
            this.log("Shutting down habitat")
            this.habitat.close()
        }


        onInput()
        {
            // TODO: control message.. send to habitat app!
        }


        nodesStarted()
        {
            super.nodesStarted()
        }


    }

    RED.nodes.registerType("habitat-app", Habitat_Node_App);
}
