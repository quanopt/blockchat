'use strict';
var path = require('path');
var fs = require('fs');

var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');

var tx_id = null;
var nonce = null;
var config = require('../config.json');
var helper = require('./helper.js');
var ORGS = helper.ORGS;
var allEventhubs = [];

//
//Attempt to send a request to the orderer with the sendCreateChain method
//
var joinChannel = function (channelName, org, peers) {
  console.log(`<<<<<<<<<<<<<<<<< Joining ${org} >>>>>>>>>>>>>>>>>`);

  console.log(`Calling peers in organization "${org}" to join the channel`);

  var client = helper.getClientForOrg(org);
  var channel = helper.getChannelForOrg(org);
  var eventHubs = [];

  return helper.getOrgAdmin(org).then((admin) => {
    console.log(`received member object for admin of the organization: ${org}`);
    tx_id = client.newTransactionID();
    let request = {
      txId: tx_id
    };

    return channel.getGenesisBlock(request);
  }).then((genesis_block) => {
    tx_id = client.newTransactionID();
    var request = {
      targets: helper.newPeers(peers),
      txId: tx_id,
      block: genesis_block
    };

    for (let key in ORGS[org]) {
      if (ORGS[org].hasOwnProperty(key)) {
        if (key.indexOf('peer') === 0) {
          let data = fs.readFileSync(path.join(__dirname, ORGS[org][key]['tls_cacerts']));
          let eventHub = client.newEventHub();
          eventHub.setPeerAddr(ORGS[org][key].events, {
            pem: Buffer.from(data).toString(),
            'ssl-target-name-override': ORGS[org][key]['server-hostname']
          });
          eventHub.connect();
          eventHubs.push(eventHub);
          allEventhubs.push(eventHub);
        }
      }
    }

    var eventPromises = [];
    eventHubs.forEach((eventHub) => {
      let txPromise = new Promise((resolve, reject) => {
        let handle = setTimeout(reject, parseInt(config.eventWaitTime));
        eventHub.registerBlockEvent((block) => {
          clearTimeout(handle);
          // in real-world situations, a peer may have more than one channels so
          // we must check that this block came from the channel we asked the peer to join
          if (block.data.data.length === 1) {
            // Config block must only contain one transaction
            var channel_header = block.data.data[0].payload.header.channel_header;
            if (channel_header.channel_id === channelName) {
              resolve();
            }
            else {
              reject();
            }
          }
        });
      });
      eventPromises.push(txPromise);
    });
    let sendPromise = channel.joinChannel(request);
    return Promise.all([sendPromise].concat(eventPromises));
  }, (err) => {
    console.log(`Failed to get org admin: ${err.stack ? err.stack : err}`);
    throw new Error(`Failed to get org admin: ${err.stack ? err.stack : err}`);
  }).then((results) => {
    console.log(`Join Channel R E S P O N S E : ${results}`);
    if (results[0] && results[0][0] && results[0][0].response && results[0][0].response.status == 200) {
      console.log(`Successfully joined peers in organization ${org} to the channel ${channelName}`);
      closeConnections(true);
      return {
        success: true,
        message: `Successfully joined peers in organization ${org} to the channel ${channelName}`
      };
    } else {
      console.log(' Failed to join channel');
      closeConnections();
      throw new Error('Failed to join channel');
    }
  }, (err) => {
    console.log(`Failed to join channel due to error: ${err.stack ? err.stack : err}`);
    closeConnections();
    throw new Error(`Failed to join channel due to error: ${err.stack ? err.stack : err}`);
  });

  // on process exit, always disconnect the event hub
  function closeConnections(success) {
    console.log(`============ Join Channel ${success ? 'successful' : 'failed'} ============`);
    for (var key in allEventhubs) {
      var eventhub = allEventhubs[key];
      if (eventhub && eventhub.isconnected()) {
        eventhub.disconnect();
      }
    }
  };
};

exports.joinChannel = joinChannel;
