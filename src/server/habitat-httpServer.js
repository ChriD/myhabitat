"use strict"

const Habitat_Base  = require('../habitat-base.js')
const http          = require('http');
const url           = require('url');
const fs            = require('fs');
const path          = require('path');

/**
 *
 */
class Habitat_HTTPServer extends Habitat_Base
{
  constructor(_port = 8080)
  {
    super()

    this.httpServer   = null
    this.port         = _port
    this.defaultPath  = ""

     // maps file extention to MIME typere
    this.mimeMap = {
      '.ico': 'image/x-icon',
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword'
    }
  }

  /**
   * returns the prefix for the logs. should be overwritten
   * @return {String} the prefix for every log
   */
  getLogPrefix()
  {
    return "[GUI-SERVER]"
  }


  listen()
  {
    var self = this

    try
    {
      // create the server obect and set a listener method for incoming requests
      self.httpServer = http.createServer(function(_request, _response){
        self.listener(_request, _response)
      })

      // start erving files on specified port
      self.httpServer.listen(self.port)
      self.logInfo("Server is started on port: " + self.port.toString())
    }
    catch(_exception)
    {
      self.logError("Error starting Server on port: " + self.port.toString())
    }
  }


  close()
  {
    var self = this
    if(self.httpServer)
    {
      self.httpServer.close()
      self.logInfo("Server closed")
    }
  }


  listener(_request, _response)
  {
    var self = this

    self.logDebug("Request: " + _request.method + " : " + _request.url)

    // parse URL
    const parsedUrl = url.parse( _request.url)
    // extract URL path
    let pathname = `.${parsedUrl.pathname}`
    // based on the URL path, extract the file extention. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext;

    // the root of the files is the given defaultPath
    pathname = self.defaultPath + pathname

    fs.exists(pathname, function (exist) {
      if(!exist)
      {
        // if the file is not found, return 404
        _response.statusCode = 404;
        _response.end(`File ${pathname} not found!`);
        return
      }

      // if is a directory search for index file matching the extention
      if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

      // read file from file system
      fs.readFile(pathname, function(err, data){
        if(err)
        {
          _response.statusCode = 500;
          _response.end(`Error getting the file: ${err}.`);
        }
        else
        {
          // if the file is found, set Content-type and send data
          _response.setHeader('Content-type', self.mimeMap[ext] || 'text/plain' );
          _response.end(data);
        }
      })
    })
  }

}


module.exports = Habitat_HTTPServer

