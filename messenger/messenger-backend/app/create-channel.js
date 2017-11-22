var fs = require('fs');
var path = require('path');
var config = require('../config.json');
var helper = require('./helper.js');

//Attempt to send a request to the orderer with the sendCreateChain method
var createChannel = function(orgName, channelName, channelCreateTx) {
	console.log('\n==================== Create channel ====================');
	console.log(`==== orgName: ${orgName} ====`);
	console.log(`==== name: '${channelName}'  ====`);
	console.log(`==== creationTx: ${path.join(__dirname, `../${channelCreateTx}`)} ====`);
	
	var client = helper.getClientForOrg(orgName);
	var channel = helper.getChannelForOrg(orgName);

	// read in the envelope for the channel config raw bytes
	var envelope = fs.readFileSync(path.join(__dirname, `../${channelCreateTx}`));
	// extract the channel config bytes from the envelope to be signed
	var channelConfig = client.extractChannelConfig(envelope);

	//Acting as a client in the given organization provided with "orgName" param
	return helper.getOrgAdmin(orgName).then((admin) => {
		console.log(`Successfully acquired admin user for the organization ${orgName}`);
		// sign the channel config bytes as "endorsement", this is required by
		// the orderer's channel creation policy
		let signature = client.signChannelConfig(channelConfig);

		let request = {
			config: channelConfig,
			signatures: [signature],
			name: channelName,
			orderer: channel.getOrderers()[0],
			txId: client.newTransactionID()
		};

		// send to orderer
		return client.createChannel(request);
	}, (err) => {
		console.log(`Failed to create channel for org '${orgName}'. Error: ${err}`);
		throw new Error(`Failed to create channel for org '${orgName}' ${err}`);
	}).then((response) => {
		console.log(' response ::%j', response);
		if (response && response.status === 'SUCCESS') {
			console.log('Successfully created the channel.');
			let response = {
				success: true,
				message: `Channel ${channelName} created successfully!`,
			};
		  	return response;
		} else {
			console.log(`!!!!!!!!! Failed to create the channel '${channelName}' !!!!!!!!!`);
			throw new Error(`Failed to create the channel '${channelName}'`);
		}
	}, (err) => {
		let stack = err.stack ? err.stack : err;
		console.log(`Failed to initialize the channel: ${stack}`);
		throw new Error(`Failed to initialize the channel: ${stack}`);
	});
};

exports.createChannel = createChannel;
