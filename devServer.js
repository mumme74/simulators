"use strict";

const express = require('express');
const serveIndex = require('serve-index');
const server = express();

server.use(
  express.static(__dirname + '/'),
  serveIndex(__dirname + '/', {'icons': true}));

const port = process.env.PORT || 8000;
const serv = server.listen(port);
console.log(`Server running on http://localhost:${port}`);
serv.port = port;

exports.server = serv;
