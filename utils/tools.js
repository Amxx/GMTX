const { ethers } = require('ethers');
const sigUtil    = require('eth-sig-util')

ethers.errors.setLogLevel('error');

const TYPES =
{
	EIP712Domain: [
		{ name: "name",              type: "string"  },
		{ name: "version",           type: "string"  },
		{ name: "chainId",           type: "uint256" },
		{ name: "verifyingContract", type: "address" },
	],
	GMTX: [
		{ name: "sender", type: "address" },
		{ name: "data",   type: "bytes"   },
		{ name: "value",  type: "uint256" },
		{ name: "nonce",  type: "uint256" },
		{ name: "expiry", type: "uint256" },
		{ name: "salt",   type: "bytes32" },
	],
}

function sanitize(gmtx)
{
	return {
		// sender is necessary
		// data is necessary
		value:  0,
		nonce:  0,
		expiry: 0,
		salt:   ethers.utils.hexlify(ethers.utils.randomBytes(32)),
		...tx
	};
}

function sign(gmtx, target, pk)
{
	return new Promise((resolve, reject) => {
		target.domain()
		.then(domain => {
			let data =
			{
				types: TYPES,
				primaryType: 'GMTX',
				domain:
				{
					name:              domain.name,
					version:           domain.version,
					chainId:           domain.chainId.toString(),
					verifyingContract: domain.verifyingContract
				},
				message:
				{
					sender: gmtx.sender.toString(),
					data:   gmtx.data,
					value:  gmtx.value.toString(),
					nonce:  gmtx.nonce.toString(),
					expiry: gmtx.expiry.toString(),
					salt:   gmtx.salt.toString()
				},
			}
			resolve(sigUtil.signTypedData(Buffer.from(pk.substr(2), 'hex'), { data }))
			// signer.provider._sendAsync({
			// 	method: "eth_signTypedData_v4",
			// 	params: [ signer.address, JSON.stringify({ data }) ],
			// 	from: signer.address,
			// }, (err, result) => {
			// 	if (!err)
			// 	{
			// 		resolve(result.result)
			// 	}
			// 	else
			// 	{
			// 		resolve(sigUtil.signTypedData(Buffer.from(signer.signingKey.privateKey.substr(2), 'hex'), { data }))
			// 	}
			// });
		})
		.catch(reject)
	});
}

function inline(gmtx)
{
	return [[gmtx.sender, gmtx.data, gmtx.value, gmtx.nonce, gmtx.expiry, gmtx.salt]];
}

module.exports = {
	TYPES,
	sanitize,
	sign,
	inline,
}
