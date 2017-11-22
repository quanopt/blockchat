'use strict';

var path = require('path');
var fs = require('fs');
var hfc = require('fabric-client');

var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var config = require('../config.json');
var helper = require('./helper.js');
hfc.addConfigFile(path.join(__dirname, 'network-config.json'));
var ORGS = hfc.getConfigSetting('network-config');

var instantiateChaincode = function (channelName, chaincodeName, chaincodeVersion, functionName, args, org) {
  console.log(`<<<<<<<<<<<<<<<<< CC instantiation: ${org} >>>>>>>>>>>>>>>>>`);

  var tx_id = null;
  var eventHub = null;

  var channel = helper.getChannelForOrg(org);
  var client = helper.getClientForOrg(org);

  return helper.getOrgAdmin(org).then((user) => {
    // read the config block from the orderer for the channel
    // and initialize the verify MSPs based on the participating
    // organizations
    return channel.initialize();
  }, (err) => {
    console.log(`Failed to get admin peer for ${org}: ${err}`);
    throw new Error(`Failed to get admin peer for ${org}: ${err}`);
  }).then((success) => {
    tx_id = client.newTransactionID();
    // send proposal to endorser
    var request = {
      chaincodeId: chaincodeName,
      chaincodeVersion: chaincodeVersion,
      fcn: functionName,
      args: args,
      txId: tx_id
    };
    console.log('--------------request--------------');
    console.log(request);
    return channel.sendInstantiateProposal(request);
  }, (err) => {
    console.log('Failed to initialize the channel');
    throw new Error('Failed to initialize the channel');
  }).then((results) => {
    var proposalResponses = results[0];
    var proposal = results[1];
    var all_good = true;
    for (var i in proposalResponses) {
      let one_good = false;
      if (proposalResponses && proposalResponses[0].response &&
        proposalResponses[0].response.status === 200) {
        one_good = true;
        console.log('instantiate proposal was good');
      } else {
        console.log('instantiate proposal was bad');
      }
      all_good = all_good & one_good;
    }
    if (all_good) {
      let { status, message, payload } = proposalResponses[0].response;
      console.log(`Successfully sent proposal: ${status}, message - ${message}, ${payload}`);
      var request = {
        proposalResponses: proposalResponses,
        proposal: proposal
      };
      // set the transaction listener and set a timeout of 30sec if the transaction
      // did not get committed within the timeout period, fail the test
      var deployId = tx_id.getTransactionID();

      eventHub = client.newEventHub();
      let data = fs.readFileSync(path.join(__dirname, ORGS[org]['peer1'][
        'tls_cacerts'
      ]));
      console.log(`-----------------------------------------------------------
			Cert
			================================================`);
      console.log(data);
      eventHub.setPeerAddr(ORGS[org]['peer1']['events'], {
        pem: Buffer.from(data).toString(),
        'ssl-target-name-override': ORGS[org]['peer1']['server-hostname']
      });
      eventHub.connect();

      let txPromise = new Promise((resolve, reject) => {
        let handle = setTimeout(() => {
          eventHub.disconnect();
          reject();
        }, 30000);

        eventHub.registerTxEvent(deployId, (tx, code) => {
          console.log(
            'The chaincode instantiate transaction has been committed on peer ' +
            eventHub._ep._endpoint.addr);
          clearTimeout(handle);
          eventHub.unregisterTxEvent(deployId);
          eventHub.disconnect();

          if (code !== 'VALID') {
            console.log(`The chaincode instantiate transaction was invalid, code = ${code}`);
            reject();
          } else {
            console.log('The chaincode instantiate transaction was valid.');
            resolve();
          }
        });
      });

      var sendPromise = channel.sendTransaction(request);
      return Promise.all([sendPromise].concat([txPromise])).then((results) => {
        console.log('Event promise all complete and testing complete');
        return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
      }).catch((err) => {
        console.log(`Failed to send instantiate transaction and get notifications within the timeout period. ${err}`);
        return 'Failed to send instantiate transaction and get notifications within the timeout period.';
      });
    } else {
      console.log('Failed to send or receive proposal response or receive valid response. Exiting...');
      return 'Failed to send instantiate proposal or receive valid response. Response null or status is not 200. exiting...';
    }
  }, (err) => {
    console.log(`Failed due to error: ${err.stack ? err.stack : err}`);
    return `Failed due to error: ${err.stack ? err.stack : err}`;
  }).then((response) => {
    if (response.status === 'SUCCESS') {
      console.log('Successfully sent transaction to the orderer.');
      return 'Chaincode instance started SUCCESS';
    } else {
      console.log('Failed to order the transaction. Error code: ' + response.status);
      return 'Failed to order the transaction. Error code: ' + response.status;
    }
  }, (err) => {
    console.log(`Failed to send instantiation: ${err.stack ? err.stack : err}`);
    return `Failed to send instantiation: ${err.stack ? err.stack : err}`;
  });
};

exports.instantiateChaincode = instantiateChaincode;
