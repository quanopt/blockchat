"use strict";

// let { invoke, query } = require('./request');
let router = require('express').Router();
let auth = require('./auth');
let globalConfig = require('./config.json');
let isCCInitialized = require('./started.json');
let fs = require('fs');

let channels = require('./app/create-channel.js');
let join = require('./app/join-channel.js');
let install = require('./app/install-chaincode.js');
let instantiate = require('./app/instantiate-chaincode.js');
let invokeTrx = require('./app/invoke-transaction.js');
let queryTrx = require('./app/query.js');

const inval = (...vals) => vals.some(val => val === undefined || val === null || val === '');
const delay = time => new Promise(resolve => setTimeout(resolve, time));

function init() {
  if (isCCInitialized.started) return console.log('Trying to start backend with already built network.');
  fs.writeFileSync('./started.json', '{"started":true}');

  const { channelName, channelCreateTx, chaincodeName, chaincodePath, orgs } = globalConfig;
  const [org1, org2] = orgs.names;
  const [org1Peers, org2Peers] = orgs.peers;
  const user1 = ['user1', 'User 1', 'user1'];
  const user2 = ['user2', 'User 2', 'user2'];
  const installParams = [chaincodeName, chaincodePath, "v0"];
  const instantiateParams = [channelName, chaincodeName, "v0", "init", []];

  console.log('<<<<<<<<<<<<<<<<< Create channel >>>>>>>>>>>>>>>>>');
  channels.createChannel('org1', channelName, channelCreateTx)
    .then(() => delay(2000))
    .then(() => join.joinChannel(channelName, org1, org1Peers))
    .then(() => delay(2000))
    .then(() => join.joinChannel(channelName, org2, org2Peers))
    .then(() => delay(2000))
    .then(() => install.installChaincode(...installParams, org1, org1Peers))
    .then(() => delay(2000))
    .then(() => install.installChaincode(...installParams, org2, org2Peers))
    .then(() => delay(2000))
    .then(() => {
      instantiate.instantiateChaincode(...instantiateParams, org1);
      instantiate.instantiateChaincode(...instantiateParams, org2);
    })
    .then(() => delay(30000))
    .then(() => retryUserAdd(...user1, 30000, 60))
    .then(() => retryUserAdd(...user2, 30000, 60))
    .then(() => console.log(`\n\n<<<<<<<<<<< Init done >>>>>>>>>>>>>>>>>>>\n\n`))
    .catch(err => {
      console.log('Error during setup process!');
      process.abort();
    });
}

function retryUserAdd(username, fullname, password, delayTime, maxTries) {
  if (maxTries === 0) throw new Error('User add retry count exceeded!');

  return invoke('addNewUser', [username, fullname])
    .then(() => {
      console.log(`<<<<<<<<<<< Added user: '${username}' >>>>>>>>>>>>>>>>>>>`);
      auth.createUser(username, fullname, password, (err) => { if (err) { console.log(err); process.abort(); } });
      return 'OK';
    }).catch(err => {
      console.log(`Error adding user 'pi-master'! ${err}`);
      return delay(delayTime).then(() => retryUserAdd(username, fullname, password, delayTime, maxTries - 1));
    });
}

// Create Channel
// expects: {}
router.post('/channels', function (req, res) {
  console.log('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
  let { channelName, channelCreateTx } = globalConfig;

  channels.createChannel('org1', channelName, channelCreateTx)
    .then(function (message) {
      return res.json({ status: 'successful', message: message });
    }).catch((err) => {
      return res.json({ status: 'error' });
    });
});

// Join Channel
// expects: {
//   "orgName": "org1",
//   "peers": ["localhost:7051","localhost:7056"]
// } ...or... {
//   "orgName": "org2",
//   "peers": ["localhost:8051","localhost:8056"]
// }
router.post('/channels/peers', function (req, res) {
  console.log('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
  var channelName = globalConfig.channelName;
  var { peers, orgName } = req.body;
  console.log('channelName : ' + channelName);
  console.log('peers : ' + peers);
  if (!peers || peers.length === 0) {
    return res.json({ status: 'error', message: 'Request must conatin peers' });
  }

  join.joinChannel(channelName, orgName, peers)
    .then(function (message) {
      return res.json({ status: 'successful', message: message });
    }).catch((err) => {  // This path seems to wait for the request timeout even when an error is returned sooner...
      return res.json({ status: 'error' });
    });
});

// Install chaincode on target peers
// expects: {
//   "orgName": "org1",
//   "peers": ["localhost:7051","localhost:7056"],
//   "chaincodeName":"mycc",
//   "chaincodePath":"github.com/messenger",
//   "chaincodeVersion":"v0"
// } ...or... {
//   "orgName": "org2",
//   "peers": ["localhost:8051","localhost:8056"],
//   "chaincodeName":"mycc",
//   "chaincodePath":"github.com/messenger",
//   "chaincodeVersion":"v0"
// }
router.post('/chaincodes', function (req, res) {
  console.log('<<<<<<<<<<<<<<<<< INSTALL CHAINCODE >>>>>>>>>>>>>>>>>');
  let { peers, orgName, chaincodeName, chaincodePath, chaincodeVersion } = req.body;
  if (inval(peers, chaincodeName, chaincodePath, chaincodeVersion) || peers.length === 0) {
    return res.json({ status: 'error' });
  }

  console.log('org: ' + orgName);
  console.log('peers : ' + peers); // target peers list
  console.log('chaincodeName : ' + chaincodeName);
  console.log('chaincodePath  : ' + chaincodePath);
  console.log('chaincodeVersion  : ' + chaincodeVersion);

  install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, orgName)
    .then(function (message) {
      return res.json({ status: 'successful', message: message });
    }).catch((err) => {
      return res.json({ status: 'error' });
    });
});

// Instantiate chaincode on target peers
// expects: {
// 	"orgName": "org1",
// 	"channelName": "mychannel",
// 	"chaincodeName":"mycc",
// 	"chaincodeVersion":"v0",
// 	"functionName":"init",
// 	"args":[""]
// }
router.post('/initchaincode', function (req, res) {
  console.log('<<<<<<<<<<<<<<<<< INSTANTIATE CHAINCODE >>>>>>>>>>>>>>>>>');
  let { chaincodeName, chaincodeVersion, channelName, functionName, args, orgName } = req.body;
  if (inval(chaincodeName, chaincodeVersion, channelName, functionName, args, orgName)) {
    return res.json({ status: 'error' });
  }

  console.log('org: ' + orgName);
  console.log('channelName  : ' + channelName);
  console.log('chaincodeName : ' + chaincodeName);
  console.log('chaincodeVersion  : ' + chaincodeVersion);
  console.log('functionName  : ' + functionName);
  console.log('args  : ' + args);

  instantiate.instantiateChaincode(channelName, chaincodeName, chaincodeVersion, functionName, args, orgName)
    .then(function (message) {
      return res.json({ status: 'successful', message: message });
    }).catch((err) => {
      return res.json({ status: 'error' });
    });
});

// expects: {
//  "channelName": "mychannel",
//  "chaincodeName": "mycc",
//  "orgName": "org1",
//  "peers": ["localhost:7051", "localhost:8051"],
//  "fcn":"move",
//  "args":["a","b","10"]
// }
// Invoke transaction on chaincode on target peers
router.post('/invoke', function (req, res) {
  console.log('<<<<<<<<<<<<<<<<< INVOKE ON CHAINCODE >>>>>>>>>>>>>>>>>');
  let { orgName, peers, chaincodeName, channelName, fcn, args } = req.body;
  if (inval(orgName, peers, chaincodeName, channelName, fcn, args) || peers.length === 0) {
    return res.json({ status: 'error' });
  }

  console.log('channelName  : ' + channelName);
  console.log('chaincodeName : ' + chaincodeName);
  console.log('fcn  : ' + fcn);
  console.log('args  : ' + args);

  invokeTrx.invokeChaincode(peers, channelName, chaincodeName, fcn, args, orgName)
    .then(function (message) {
      res.json({ status: 'successful', txId: message });
    }).catch((err) => {
      res.json({ status: 'error' });
    });
});

// Query on chaincode on target peers
// expects: {
//   "channelName": "mychannel",
//   "chaincodeName": "mycc",
//   "orgName": "org1",
//   "peer": "peer1",
//   "fcn":"users",
//   "args":[]
// }
router.post('/query', function (req, res) {
  console.log('<<<<<<<<<<<<<<<<< QUERY BY CHAINCODE >>>>>>>>>>>>>>>>>');
  let { channelName, chaincodeName, args, fcn, peer, orgName } = req.body;
  if (inval(channelName, chaincodeName, args, fcn, peer, orgName)) {
    return res.json({ status: 'error' });
  }

  console.log('channelName : ' + channelName);
  console.log('chaincodeName : ' + chaincodeName);
  console.log('fcn : ' + fcn);
  console.log('args : ' + args);

  queryTrx.queryChaincode(peer, channelName, chaincodeName, args, fcn, orgName)
    .then(function (message) {
      return res.json({ status: 'successful', message: message });
    }).catch((err) => {
      return res.json({ status: 'error' });
    });
});


function invoke(fcn, args) {
  let peers = ["localhost:7051", "localhost:7056"];
  let channelName = "mychannel";
  let chaincodeName = "mycc";
  let orgName = "org1";
  return invokeTrx.invokeChaincode(peers, channelName, chaincodeName, fcn, args, orgName);
}
function query(fcn, args) {
  let channelName = "mychannel";
  let chaincodeName = "mycc";
  let orgName = "org1";
  let peer = "peer1";
  return queryTrx.queryChaincode(peer, channelName, chaincodeName, args, fcn, orgName);
}


router.route('/register').post((req, res) => {
  console.log('Register request arrived!');
  let { username, password, fullname } = req.body;
  // Is req valid?
  if (inval(username, password, fullname)) return res.json({ status: 'failed' });
  // Create user locally
  auth.createUser(username, fullname, password, (err, user) => {
    if (err) return res.json({ status: 'error', message: err });
    // Local user create OK, create on blockchain
    invoke('addNewUser', [username, fullname]).then((txid) => {
      // Blockchain add OK
      console.log(`User added: ${username} - ${fullname}!`);
      return res.json({ status: 'successful', user: user, txid: txid });
    }).catch(err => {
      // Blockchain add failed, remove local user
      console.log(`Error adding user! ${err}`);
      auth.removeUser(username);
      return res.json({ status: 'error', message: err });
    });
  });
});

router.route('/login').post((req, res) => {
  console.log('Login request arrived!');
  let { username, password } = req.body;
  // Is req valid?
  if (inval(username, password)) return res.json({ status: 'error' });
  // Check user auth info
  auth.verifyUser(username, password, (err, user) => {
    if (err) return res.json({ status: 'error', message: err });
    // Login OK
    return res.json({ status: 'successful', user: user });
  });
});

// Endpoint for adding users
// expects: { username: 'user1' }
router.route('/adduser').post((req, res) => {
  if (!req.body || !req.body.username) {
    res.json({ status: 'error' });
    return;
  }
  let { username } = req.body;

  invoke('addNewUser', [username]).then(() => {
    console.log(`User added: ${username}!`);
    res.json({ status: 'successful' });
  }).catch(err => {
    console.log(`Error adding user! ${err}`);
    res.json({ status: 'error', message: err });
  });
});

const authorizedEndpoint = (req, res, next) => {
  if (!req.body || !req.body.token || !req.body.username ||
      !auth.isTokenValid(req.body.username, req.body.token)) {
    return res.json({status: "unauthorized"});
  }
  next();
}

// Endpoint for sending a message
// expects: {
//   from: 'user1',
//   to: 'user2',
//   content: 'Hey',
// }
router.route('/sendmessage').post(authorizedEndpoint, (req, res) => {
  if (!req.body || !req.body.from || !req.body.to || !req.body.content) {
    res.json({ status: 'error' });
    return;
  }
  let { from, to, content } = req.body;

  invoke('sendMessage', [from, to, content]).then(() => {
    console.log(`Message sent from ${from} to ${to}!`);
    res.json({ status: 'successful' });
  }).catch(err => {
    console.log(`Error sending message! ${err}`);
    res.json({ status: 'error', message: err });
  });
});

// Endpoint for querying messages of the user
// expects: { username: 'user1' }
router.route('/getmessages').post(authorizedEndpoint, (req, res) => {
  if (!req.body || !req.body.username) {
    res.json({ status: 'error' });
    return;
  }
  let { username } = req.body;

  query('getMess', [username]).then(vals => {
    console.log(`Messages retrieved for user ${username}!`);
    console.log(vals);
    res.json({ status: 'successful', messages: JSON.parse(vals) });
  }).catch(err => {
    console.log(`Error retrieving messages! ${err}`);
    res.json({ status: 'error', message: err });
  });
});

// Endpoint for querying users
// expects: { }
router.route('/getusers').post((req, res) => {
  query('users', []).then(vals => {
    console.log(`Users retrieved!`);
    res.json({ status: 'successful', users: JSON.parse(vals) });
  }).catch(err => {
    console.log(`Error retrieving users! ${err}`);
    res.json({ status: 'error', message: err });
  });
});

module.exports = { router: router, initialize: init };
