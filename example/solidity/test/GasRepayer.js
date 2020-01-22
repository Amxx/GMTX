var GasRepayer = artifacts.require('GasRepayer');
var MessageHub = artifacts.require('MessageHub');

// const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { TypedDataUtils } = require('eth-sig-util')
const tools              = require('../utils/tools');
const wallets            = require('../utils/wallets');

Object.extract = (obj, keys) => keys.map(key => obj[key]);

function extractEvents(txMined, address, name)
{
	return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name });
}

contract('GasRepayer', async (accounts) => {

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before('configure', async () => {
		console.log('# web3 version:', web3.version);

		/**
		 * Retreive deployed contracts
		 */
		GasRepayerInstance = await GasRepayer.deployed();
		MessageHubInstance = await MessageHub.deployed();

		GAS_PRICE = await web3.eth.getGasPrice();
	});

	describe('pre flight check', async () => {
		it('domains', async () => {
			messagehub_domain = await MessageHubInstance.gmtx_domain();
			assert.equal(messagehub_domain.name,              'GeneralizedMetaTX'       );
			assert.equal(messagehub_domain.version,           '0.0.1-beta.1'            );
			assert.equal(messagehub_domain.chainId,           '1'                       ); // TODO: wait for ganache fix
			assert.equal(messagehub_domain.verifyingContract, MessageHubInstance.address);

			gasrelayer_domain = await GasRepayerInstance.gmtx_domain();
			assert.equal(gasrelayer_domain.name,              'GeneralizedMetaTX'       );
			assert.equal(gasrelayer_domain.version,           '0.0.1-beta.1'            );
			assert.equal(gasrelayer_domain.chainId,           '1'                       ); // TODO: wait for ganache fix
			assert.equal(gasrelayer_domain.verifyingContract, GasRepayerInstance.address);
		});

		it('deposit', async () => {
			const value = 1 * 10 ** 18;
			await web3.eth.sendTransaction({ from: accounts[1], to: GasRepayerInstance.address, value });
			assert.equal(await GasRepayerInstance.balanceOf(accounts[1]), value);
		});
	});

	describe('MessageHub', async () => {
		describe('relayed call', async () => {
			it('prepare gmtx', async () => {
				args = [
					'relayed-call-test',
				];

				messagehub_gmtx = {
					sender: accounts[2],
					data:   MessageHubInstance.contract.methods.publish(...args).encodeABI(),
					value:  0,
					nonce:  0,
					expiry: 0,
					salt:   web3.utils.randomHex(32),
				};
				messagehub_sign = await tools.sign(messagehub_gmtx, MessageHubInstance, wallets.privateKeys[accounts[2].toLowerCase()]);

				// target, call, gasPrice, gasAmount
				args = [
					MessageHubInstance.address,
					MessageHubInstance.contract.methods.receiveMetaTx(messagehub_gmtx, messagehub_sign).encodeABI(),
					GAS_PRICE,
					100000,
				];

				gasrelayer_gmtx = {
					sender: accounts[1],
					data:   GasRepayerInstance.contract.methods.relayAndRepay(...args).encodeABI(),
					value:  0,
					nonce:  0,
					expiry: 0,
					salt:   web3.utils.randomHex(32),
				};
				gasrelayer_sign  = await tools.sign(gasrelayer_gmtx, GasRepayerInstance, wallets.privateKeys[accounts[1].toLowerCase()]);


				// Only for MessageHub purposes
				_messagehub_digest = '0x'+TypedDataUtils.sign({
					domain:      messagehub_domain,
					types:       tools.TYPES,
					primaryType: 'GMTX',
					message:     messagehub_gmtx,
				}).toString('hex');
				// Only for MessageHub purposes
				_gasrelayer_digest = '0x'+TypedDataUtils.sign({
					domain:      gasrelayer_domain,
					types:       tools.TYPES,
					primaryType: 'GMTX',
					message:     gasrelayer_gmtx,
				}).toString('hex');
			});

			it('before', async () => {
				assert.equal(await MessageHubInstance.gmtx_nonce(accounts[2]), 0);
				assert.equal(await GasRepayerInstance.gmtx_nonce(accounts[1]), 0);
				assert.equal(await MessageHubInstance.gmtx_replay(_messagehub_digest), false);
				assert.equal(await GasRepayerInstance.gmtx_replay(_gasrelayer_digest), false);
			});

			it('tx', async () => {
				txMined = await GasRepayerInstance.receiveMetaTx(gasrelayer_gmtx, gasrelayer_sign, { from: accounts[0] });
				
				// Not instrumented correctly by truffle
				// events = extractEvents(txMined, MessageHubInstance.address, 'NewMessage');
				// assert.equal(events.length,          1);
				// assert.equal(events[0].args.sender,  accounts[1]);
				// assert.equal(events[0].args.message, 'relayed-call-test');

				events = extractEvents(txMined, MessageHubInstance.address, 'GMTXReceived');
				assert.equal(events.length,       1);
				assert.equal(events[0].args.hash, _messagehub_digest);

				events = extractEvents(txMined, GasRepayerInstance.address, 'GMTXReceived');
				assert.equal(events.length,       1);
				assert.equal(events[0].args.hash, _gasrelayer_digest);

				events = extractEvents(txMined, GasRepayerInstance.address, 'CallOutcome');
				assert.equal(events.length,             1);
				assert.equal(events[0].args.success,    true);
				assert.equal(events[0].args.returnData, null);

				events = extractEvents(txMined, GasRepayerInstance.address, 'Transfer');
				assert.equal(events.length,             1);

				console.log(Number(events[0].args.value));
				console.log(txMined.receipt.cumulativeGasUsed * GAS_PRICE);
				console.log("net gas cost:", ((txMined.receipt.cumulativeGasUsed * GAS_PRICE) - Number(events[0].args.value)) / GAS_PRICE);
			});

			it('after', async () => {
				assert.equal(await MessageHubInstance.gmtx_nonce(accounts[2]), 1);
				assert.equal(await GasRepayerInstance.gmtx_nonce(accounts[1]), 1);
				assert.equal(await MessageHubInstance.gmtx_replay(_messagehub_digest), true);
				assert.equal(await GasRepayerInstance.gmtx_replay(_gasrelayer_digest), true);
			});
		});
	});

});
