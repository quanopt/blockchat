'use strict';

var path = require('path');
var fs = require('fs');

var hfc = require('fabric-client');
var Peer = require('fabric-client/lib/Peer.js');
var config = require('../config.json');
var helper = require('./helper.js');
var EventHub = require('fabric-client/lib/EventHub.js');
hfc.addConfigFile(path.join(__dirname, 'network-config.json'));
var ORGS = hfc.getConfigSetting('network-config');

var invokeChaincode = function(peersUrls, channelName, chaincodeName, fcn, args, org) {
	//console.log(`============ invoke transaction on organization ${org} ============`);
	var client = helper.getClientForOrg(org);
	var channel = helper.getChannelForOrg(org);
	var targets = helper.newPeers(peersUrls);
	var tx_id = null;

	return helper.getOrgAdmin(org).then((user) => {
		tx_id = client.newTransactionID();
		//console.log(`Sending transaction ${tx_id}`);
		// send proposal to endorser
		var request = {
			targets: targets,
			chaincodeId: chaincodeName,
			fcn: fcn,
			args: args,
			chainId: channelName,
			txId: tx_id
		};
		return channel.sendTransactionProposal(request);
	}, (err) => {
		//console.log(`Failed to get admin peer for ${org}: ${err}`);
		throw new Error(`Failed to get admin peer for ${org}: ${err}`);
	}).then((results) => {
		var proposalResponses = results[0];
		var proposal = results[1];
		var all_good = true;
		for (var i in proposalResponses) {
			if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
				//console.log('transaction proposal was good');
			} else {
				all_good = false;
				//console.log('transaction proposal was bad');
			}
		}
		if (all_good) {
			let {status, message, payload} = proposalResponses[0].response; 
			//console.log(`Successfully sent proposal, response: ${status}, ${message}, ${payload}`);
			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal
			};
			// set the transaction listener and set a timeout of 30sec
			// if the transaction did not get committed within the timeout period,
			// fail the test
			var transactionID = tx_id.getTransactionID();
			var eventPromises = [];

			var eventhubs = helper.newEventHubs(peersUrls, org);
			for (let key in eventhubs) {
				let eh = eventhubs[key];
				eh.connect();

				let txPromise = new Promise((resolve, reject) => {
					let handle = setTimeout(() => {
						eh.disconnect();
						reject();
					}, 30000);

					eh.registerTxEvent(transactionID, (tx, code) => {
						clearTimeout(handle);
						eh.unregisterTxEvent(transactionID);
						eh.disconnect();

						if (code !== 'VALID') {
							//console.log('The balance transfer transaction was invalid, code = ' + code);
							reject();
						} else {
							//console.log('The balance transfer transaction has been committed on peer ' + eh._ep._endpoint.addr);
							resolve();
						}
					});
				});
				eventPromises.push(txPromise);
			};
			var sendPromise = channel.sendTransaction(request);
			return Promise.all([sendPromise].concat(eventPromises)).then((results) => {
				//console.log(' event promise all complete and testing complete');
				return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call
			}).catch((err) => {
				//console.log('Failed to send transaction and get notifications within the timeout period.');
				throw new Error('Failed to send transaction and get notifications within the timeout period.');
			});
		} else {
			//console.log('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
			throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
		}
	}, (err) => {
		//console.log('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send proposal due to error: ' + err.stack ? err.stack : err);
	}).then((response) => {
		if (response.status === 'SUCCESS') {
			//console.log('Successfully sent transaction to the orderer.');
			return tx_id.getTransactionID();
		} else {
			//console.log('Failed to order the transaction. Error code: ' + response.status);
			throw new Error('Failed to order the transaction. Error code: ' + response.status);
		}
	}, (err) => {
		//console.log('Failed to send transaction due to error: ' + err.stack ? err.stack : err);
		throw new Error('Failed to send transaction due to error: ' + err.stack ? err.stack :
			err);
	});
};

exports.invokeChaincode = invokeChaincode;
