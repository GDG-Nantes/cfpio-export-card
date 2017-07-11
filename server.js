#!/usr/bin/env node

var static = require("node-static");

//
// Create a node-static server instance to serve the '.' folder
//
var file = new static.Server(".");

return require("http")
  .createServer(function(request, response) {
    request
      .addListener("end", function() {
        //
        // Serve files!
        //
        file.serve(request, response);
      })
      .resume();
  })
  .listen(8081);
