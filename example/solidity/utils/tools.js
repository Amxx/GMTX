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
		{ name: "from",   type: "address" },
		{ name: "data",   type: "bytes"   },
		{ name: "gas",    type: "uint256" },
		{ name: "value",  type: "uint256" },
		{ name: "nonce",  type: "uint256" },
		{ name: "expiry", type: "uint256" },
		{ name: "salt",   type: "bytes32" },
	],
}

function sanitize(gmtx)
{
	return {
		// from is necessary
		// data is necessary
		// gas is necessary
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
		target.gmtx_domain()
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
					from:   gmtx.from.toString(),
					data:   gmtx.data,
					value:  gmtx.value.toString(),
					gas:    gmtx.gas.toString(),
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

module.exports = {
	TYPES,
	sanitize,
	sign,
}
