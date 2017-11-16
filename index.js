require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const proxy = require('express-http-proxy');

const MESSAGEBIRD_API_KEY = process.env.MESSAGEBIRD_API_KEY;
const ALLOWED_ACCESS_KEY = process.env.ALLOWED_ACCESS_KEY;

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Proxy requests to /messagebird/{resource} 1<>1 with the Messagebird REST API
// API docs: https://developers.messagebird.com/docs/messaging
app.use(
  '/messagebird',
  proxy('https://rest.messagebird.com/', {
    proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
      // you can update headers
      proxyReqOpts.headers['Accept'] = 'application/json';
      proxyReqOpts.headers[
        'Authorization'
      ] = `AccessKey ${MESSAGEBIRD_API_KEY}`;
      return proxyReqOpts;
    }
  })
);

// Super basic way to ensure request sent without the accesKey in the
// authorization header is denied
app.use('/', (req, res, next) => {
  const accessKey = req.headers.authorization;
  console.log('access', accessKey, ALLOWED_ACCESS_KEY);
  if (accessKey !== `AccessKey ${ALLOWED_ACCESS_KEY}`) {
    res.send(401);
  }

  next();
});

server.listen(process.env.PORT || 8080, () => {
  console.log('Listening on %d', server.address().port);
});
