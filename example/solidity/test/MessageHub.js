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

contract('MessageHub', async (accounts) => {

	/***************************************************************************
	 *                        Environment configuration                        *
	 ***************************************************************************/
	before('configure', async () => {
		console.log('# web3 version:', web3.version);

		/**
		 * Retreive deployed contracts
		 */
		MessageHubInstance = await MessageHub.deployed();
	});

	describe('pre flight check', async () => {
		it('domain', async () => {
			domain = await MessageHubInstance.gmtx_domain();
			assert.equal(domain.name,              'GeneralizedMetaTX'       );
			assert.equal(domain.version,           '0.0.1-beta.1'            );
			assert.equal(domain.chainId,           '1'                       ); // TODO: wait for ganache fix
			assert.equal(domain.verifyingContract, MessageHubInstance.address);
		});
	});

	describe('MessageHub', async () => {
		describe('direct call', async () => {
			it('tx', async () => {
				txMined = await MessageHubInstance.publish('direct-call-test', { from: accounts[0] });

				events = extractEvents(txMined, MessageHubInstance.address, 'NewMessage');
				assert.equal(events.length,          1);
				assert.equal(events[0].args.sender,  accounts[0]);
				assert.equal(events[0].args.message, 'direct-call-test');
			});
		});

		describe('relayed call', async () => {
			it('prepare gmtx', async () => {
				gmtx = {
					sender: accounts[1],
					data:   MessageHubInstance.contract.methods.publish('relayed-call-test').encodeABI(),
					value:  0,
					nonce:  0,
					expiry: 0,
					salt:   web3.utils.randomHex(32),
				};
				sign = await tools.sign(gmtx, MessageHubInstance, wallets.privateKeys[accounts[1].toLowerCase()]);

				// Only for MessageHub purposes
				_digest = '0x'+TypedDataUtils.sign({
					domain:      domain,
					types:       tools.TYPES,
					primaryType: 'GMTX',
					message:     gmtx,
				}).toString('hex');
			});

			it('before', async () => {
				assert.equal(await MessageHubInstance.gmtx_nonce(accounts[1]), 0);
				assert.equal(await MessageHubInstance.gmtx_replay(_digest), false);
			});

			it('tx', async () => {
				txMined = await MessageHubInstance.receiveMetaTx(gmtx, sign, { from: accounts[0] });

				events = extractEvents(txMined, MessageHubInstance.address, 'NewMessage');
				assert.equal(events.length,          1);
				assert.equal(events[0].args.sender,  accounts[1]);
				assert.equal(events[0].args.message, 'relayed-call-test');

				events = extractEvents(txMined, MessageHubInstance.address, 'GMTXReceived');
				assert.equal(events[0].args.hash, _digest);
			});

			it('after', async () => {
				assert.equal(await MessageHubInstance.gmtx_nonce(accounts[1]), 1);
				assert.equal(await MessageHubInstance.gmtx_replay(_digest), true);
			});
		});
	});

});
