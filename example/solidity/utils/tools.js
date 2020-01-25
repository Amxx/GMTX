const { ethers } = require('ethers');
const sigUtil    = require('eth-sig-util');


ethers.errors.setLogLevel('error');

const TYPES =
{
	EIP712Domain: [
		{ name: "name",              type: "string"      },
		{ name: "version",           type: "string"      },
		{ name: "chainId",           type: "uint256"     },
		{ name: "verifyingContract", type: "address"     },
	],
	GMTX: [
		{ name: "from",              type: "address"     },
		{ name: "data",              type: "bytes"       },
		{ name: "gas",               type: "uint256"     },
		{ name: "value",             type: "uint256"     },
		{ name: "nonce",             type: "uint256"     },
		{ name: "expiry",            type: "uint256"     },
		{ name: "salt",              type: "bytes32"     },
	],
	GMTXCore: [
		{ name: "data",              type: "bytes"       },
		{ name: "gas",               type: "uint256"     },
		{ name: "value",             type: "uint256"     },
	],
	GMTXDetails: [
		{ name: "from",              type: "address"     },
		{ name: "nonce",             type: "uint256"     },
		{ name: "expiry",            type: "uint256"     },
		{ name: "salt",              type: "bytes32"     },
	],
	GMTXv2: [
		{ name: "txs",               type: "GMTXCore[]"  },
		{ name: "details",           type: "GMTXDetails" },
	],
}

function sign(primaryType, message, target, pk)
{
	return new Promise((resolve, reject) => {
		target.gmtx_domain()
		.then(domain => {
			let data =
			{
				types: TYPES,
				primaryType,
				domain,
				message,
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
	sign,
}
