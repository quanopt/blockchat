'use strict';

let hfc = require('fabric-client');
let path = require('path');
let util = require('util');
let globalConfig = require('./config.json');

let options = {
    wallet_path: path.join(__dirname, './network/creds'),
    user_id: 'PeerAdmin',
    channel_id: globalConfig.channelName,
    chaincode_id: 'fabcar',
    peer_url: 'grpc://localhost:7051',
    event_url: 'grpc://localhost:7053',
    orderer_url: 'grpc://localhost:7050'
};

let client = new hfc();
let channel = null;
let targets = [];
let initialized = false;

// Acquiring the KVS and starting the server once finished
exports.initializeClient = (callback) => {
  return hfc.newDefaultKeyValueStore({path: options.wallet_path}).then(wallet => {
    if (initialized) {
      throw('Client already initialized.');
    }
    console.log('Client state store acquired.');
    client.setStateStore(wallet);
    return client.getUserContext(options.user_id, true);
  }).then(user => {
    if (!user || !user.isEnrolled()) {
      throw('Error getting user context.');
    }
    console.log('User enrolled!');
    channel = client.newChannel(options.channel_id);
    let peerObj = client.newPeer(options.peer_url);
    channel.addPeer(peerObj);
    channel.addOrderer(client.newOrderer(options.orderer_url));
    targets.push(peerObj);
    initialized = true;
    callback();
  });
}

exports.query = (funcName, argsArray) => {
  let txId = client.newTransactionID();
  let request = {
    chaincodeId: options.chaincode_id,
    txId: txId,
    fcn: funcName,
    args: argsArray,
  };
  return channel.queryByChaincode(request).then(response => {
    if (!response.length) {
      throw('No payload returned!');
    }
    if (response[0] instanceof Error) {
      throw response[0];
    }
    console.log(JSON.stringify(response));
    return response[0].toString();
  });
}

// Returns promise
exports.invoke = (funcName, argsArray) => {
    let txId = client.newTransactionID();
    console.log(`Starting new transaction with ID: ${txId}`);
    let request = {
      targets: targets,
      chaincodeId: options.chaincode_id,
      fcn: funcName,
      args: argsArray,
      chainId: options.channel_id,
      txId: txId,
    };
    return channel.sendTransactionProposal(request).then(results => {
        let proposalResponses = results[0];
        let proposal = results[1];
        let header = results[2];
        if (!proposalResponses || !proposalResponses[0].response || proposalResponses[0].response.status !== 200) {
            throw('Proposal received invalid response/response was null or status is not 200!');
        }
        console.log(`Transaction proposal message: ${proposalResponses[0].response.message}`);
        let request = {
          proposalResponses: proposalResponses,
          proposal: proposal,
          header: header,
        };
        // Setting up a transaction listener
        let transactionId = txId.getTransactionID();
        let eventPromises = [];
        let eh = client.newEventHub();
        eh.setPeerAddr(options.event_url);
        eh.connect();

        let txPromise = new Promise((resolve, reject) => {
            let handle = setTimeout(() => {
              eh.disconnect();
              reject();
            }, 30000);

            eh.registerTxEvent(transactionId, (tx, code) => {
              clearTimeout(handle);
              eh.unregisterTxEvent(transactionId);
              eh.disconnect();

              if (code !== 'VALID') {
                  console.log(`Transaction was invalid. ${code}`);
                  reject();
                  return;
              }
              console.log('Transaction committed on peer!');
              resolve();
            });
        });
        eventPromises.push(txPromise);
        let sendPromise = channel.sendTransaction(request);
        return Promise.all([sendPromise].concat(eventPromises)).then((result) => {
          console.log('Event promises all complete!');
        }).catch((err) => {
          console.log('Failed to send transaction/receive committed events from all peers within timeout.');
        });
    });
}

/*function startServer() {
  console.log('Server successfully started!');
  if (process.argv[2].trim() != 'query') {
    console.log(process.argv.slice(3));
    invoke(process.argv[2], process.argv.slice(3)).then(() => {
      console.log('Transaction MKAY!');
    }).catch(err => {
      console.log(`Error! ${err}`);
    });
  }
  if (process.argv[2].trim() == 'query') {
    query('getMess', [process.argv[3]]).then(res => {
      console.log(res);
    }).catch(err => {
      console.log(`Error! ${err}`);
    });
  }

}*/
