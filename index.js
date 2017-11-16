require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const url = require('url');
const WebSocket = require('ws');
const proxy = require('express-http-proxy');

const MESSAGEBIRD_API_KEY = process.env.MESSAGEBIRD_API_KEY;
const ALLOWED_ACCESS_KEY = process.env.ALLOWED_ACCESS_KEY;

const app = express();

// TODO: We should probably not whitelist every domain for CORS, but for now it's OK.
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Super basic way to ensure request sent without the accesKey in the
// authorization header is denied
app.use('*', (req, res, next) => {
  // TODO: Hacky way to not block requests where we receive the message callback from the
  // Messagebird API. Instead of doing this we should probably check the host domain from which
  // The request was received
  if (req.originalUrl === '/message') {
    next();
    return;
  }

  const accessKey = req.headers.authorization;
  if (accessKey !== `AccessKey ${ALLOWED_ACCESS_KEY}`) {
    res.sendStatus(401);
    return;
  }

  next();
});

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

// Simple endpoint to verify if the given API token is valid.
app.get('/authenticate', (req, res) => {
  res.sendStatus(200);
});

app.post('/message', (req, res) => {
  const body = req.body;

  // TODO: We should probably do a more thorough check here before sending it
  if (body.type === 'sms') {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'message', data: body }));
      }
    });
  }

  res.sendStatus(200);
});

// Send a simple OK message when the websocket connects
wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'connect' }));
});

server.listen(process.env.PORT || 8080, () => {
  console.log('Listening on %d', server.address().port);
});
