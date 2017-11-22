"use strict";

let debug = require('../config.json').debug;

let http = require('http');
let https = require('https');
let express = require('express');
let fs = require('fs');
let bodyParser = require('body-parser');
let config = {
  certKey: '../app-certs/key.pem',
  certCrt: '../app-certs/cert.pem',
};
let { router, initialize } = require('./routes');

let app = express();
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', router);

let server = null;
if (debug) {
  console.log("Starting in debug mode over http...");
  server = http.createServer(app);
} else {
  console.log("Starting in deployment mode over https...");
  let privateKey = fs.readFileSync(config.certKey, 'utf8');
  let certificate = fs.readFileSync(config.certCrt, 'utf8');
  let credentials = { key: privateKey, cert: certificate };
  let server = https.createServer(credentials, app);
}
server.listen(3000);

initialize();

console.log('Server started successfully on port 3000.');
