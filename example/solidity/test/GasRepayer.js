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

function prepareGMTX(sender, target, func, args, value, nonce, expiry, salt)
{
	return {
		sender,
		data:   target.contract.methods[func](...args).encodeABI(),
		value:  value  || 0,
		nonce:  nonce  || 0,
		expiry: expiry || 0,
		salt:   salt   || web3.utils.randomHex(32),
	}
}

contract('GasRepayer', async (accounts) => {

	const [relayer, repayer, user] = accounts;

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

		it('deposit to gasrepayer contract', async () => {
			const value = 1 * 10 ** 18;
			await web3.eth.sendTransaction({ from: repayer, to: GasRepayerInstance.address, value });
			assert.equal(await GasRepayerInstance.balanceOf(repayer), value);
		});
	});

	describe('MessageHub', async () => {
		describe('relayed call', async () => {
			it('prepare gmtx', async () => {

				// User meta-transaction
				messagehub_gmtx = prepareGMTX(
					user,
					MessageHubInstance,
					'publish(string)',
					[
						'relayed-call-test',
					],
				);
				messagehub_sign = await tools.sign(messagehub_gmtx, MessageHubInstance, wallets.privateKeys[user.toLowerCase()]);

				// Repayer meta-transaction (wraps the user-metatransaction)
				gasrelayer_gmtx = prepareGMTX(
					repayer,
					GasRepayerInstance,
					'relayAndRepay(address,bytes,uint256,uint256)',
					[
						MessageHubInstance.address,
						MessageHubInstance.contract.methods.receiveMetaTx(messagehub_gmtx, messagehub_sign).encodeABI(),
						GAS_PRICE,
						100000,
					],
				);
				gasrelayer_sign  = await tools.sign(gasrelayer_gmtx, GasRepayerInstance, wallets.privateKeys[repayer.toLowerCase()]);

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
				assert.equal(await GasRepayerInstance.gmtx_nonce(repayer), 0);
				assert.equal(await MessageHubInstance.gmtx_nonce(user),    0);
				assert.equal(await GasRepayerInstance.gmtx_replay(_gasrelayer_digest), false);
				assert.equal(await MessageHubInstance.gmtx_replay(_messagehub_digest), false);
			});

			it('tx', async () => {
				txMined = await GasRepayerInstance.receiveMetaTx(gasrelayer_gmtx, gasrelayer_sign, { from: relayer });

				// Not instrumented correctly by truffle
				// events = extractEvents(txMined, MessageHubInstance.address, 'NewMessage');
				// assert.equal(events.length,          1);
				// assert.equal(events[0].args.sender,  repayer);
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
				assert.equal(await GasRepayerInstance.gmtx_nonce(repayer), 1);
				assert.equal(await MessageHubInstance.gmtx_nonce(user),    1);
				assert.equal(await GasRepayerInstance.gmtx_replay(_gasrelayer_digest), true);
				assert.equal(await MessageHubInstance.gmtx_replay(_messagehub_digest), true);
			});
		});
	});

});
