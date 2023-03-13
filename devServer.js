"use strict";

import express from 'express';
import serveIndex from 'serve-index';
import path from 'path';
import { fileURLToPath } from 'url';

const server = express();

const dirname = path.dirname(fileURLToPath(import.meta.url));

const websocketUrls = ['/pages/human/'];
function isWSUrl(url) {
  for(const wsUrl of websocketUrls)
    if (url.startsWith(wsUrl))
      return true;
  return false;
}

server.use((req, res, next) =>{
  if (req.method === 'GET' && isWSUrl(req.path))
    res.header('Access-Control-Allow-Origin', 'http://localhost:8080/*');
  next();
})

server.use(
  express.static(dirname + '/'),
  serveIndex(dirname + '/', {'icons': true}));

const port = process.env.PORT || 8000;
const serv = server.listen(port);
console.log(`Server running on http://localhost:${port}`);
serv.port = port;

export { serv , dirname};
