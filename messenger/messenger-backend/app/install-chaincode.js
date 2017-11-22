'use strict';
var path = require('path');
var fs = require('fs');
var helper = require('./helper.js');

var installChaincode = function (chaincodeName, chaincodePath, chaincodeVersion, org, peers) {
  console.log(`<<<<<<<<<<<<<<<<< CC install on ${org} >>>>>>>>>>>>>>>>>`);

  helper.setupChaincodeDeploy();
  var channel = helper.getChannelForOrg(org);
  var client = helper.getClientForOrg(org);

  return helper.getOrgAdmin(org).then((user) => {
    var request = {
      targets: helper.newPeers(peers),
      chaincodePath: chaincodePath,
      chaincodeId: chaincodeName,
      chaincodeVersion: chaincodeVersion
    };
    return client.installChaincode(request);
  }, (err) => {
    console.log(`Failed to get admin peer for ${org}: ${err}`);
    throw new Error(`Failed to get admin peer for ${org}: ${err}`);
  }).then((results) => {
    var proposalResponses = results[0];
    var proposal = results[1];
    var all_good = true;
    for (var i in proposalResponses) {
      if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status === 200) {
        console.log('install proposal was good');
      } else {
        all_good = false;
        console.log('install proposal was bad');
      }
    }
    if (all_good) {
      console.log(`Successfully sent install Proposal and received ProposalResponse: Status - ${proposalResponses[0].response.status}`);
      console.log(`Successfully Installed chaincode on organization ${org}`);
      return `Successfully Installed chaincode on organization ${org}`;
    } else {
      console.log('Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...');
      return 'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...';
    }
  }, (err) => {
    console.log(`Failed to send install proposal due to error: ${err.stack ? err.stack : err}`);
    throw new Error(`Failed to send install proposal due to error: ${err.stack ? err.stack : err}`);
  });
};

exports.installChaincode = installChaincode;
