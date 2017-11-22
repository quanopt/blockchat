"use strict";

let debug = require('../config.json').debug;

let fs = require('fs');
let http = require('http');
let https = require('https');
let express = require('express');
let bodyParser = require('body-parser');
let config = {
    certKey: '../app-certs/key.pem',
    certCrt: '../app-certs/cert.pem',
};

// Express configuration.
let app = express();
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static(__dirname + '/public'));

app.get('/register', (req, res) => {
    res.redirect('/index.html#/register');
});
app.get('/admin', (req, res) => {
    res.redirect('/index.html#/admin');
});

let server = null;
if (debug) {
    console.log("Starting in debug mode using http...");
    server = http.createServer(app);
} else {
    console.log("Starting in deployment mode using https...");
    let privateKey = fs.readFileSync(config.certKey, 'utf8');
    let certificate = fs.readFileSync(config.certCrt, 'utf8');
    let credentials = { key: privateKey, cert: certificate };
    server = https.createServer(credentials, app);
}

// Start express.
let port = process.env.PORT || 8080;
server.listen(port);
console.log('Server started successfully on port: ' + port);
