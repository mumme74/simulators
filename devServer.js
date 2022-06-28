"use strict";

import express from 'express';
import serveIndex from 'serve-index';
import path from 'path';
import { fileURLToPath } from 'url';

const server = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

server.use(
  express.static(__dirname + '/'),
  serveIndex(__dirname + '/', {'icons': true}));

const port = process.env.PORT || 8000;
const serv = server.listen(port);
console.log(`Server running on http://localhost:${port}`);
serv.port = port;

export { serv };
