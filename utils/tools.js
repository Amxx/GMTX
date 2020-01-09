const ethUtil = require("ethereumjs-util");

module.exports = {
	EIP712DOMAIN_SEPARATOR: null,
	EIP712DOMAIN_TYPEHASH:  web3.utils.keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
	GMTX_TYPEHASH:          web3.utils.keccak256("GMTX(bytes data,uint256 value,uint256 nonce,bytes32 salt)"),

	setup: function(domain)
	{
		console.log("# domain:", JSON.stringify(domain));
		this.EIP712DOMAIN_SEPARATOR = this.DomainStructHash(domain);
		console.log("EIP712DOMAIN_SEPARATOR: ", this.EIP712DOMAIN_SEPARATOR);
		console.log("GMTX_TYPEHASH:          ", this.GMTX_TYPEHASH);
	},

	/* EIP712 compliant structure hashes */
	DomainStructHash: function(domain)
	{
		return web3.utils.keccak256(web3.eth.abi.encodeParameters([
			"bytes32",
			"bytes32",
			"bytes32",
			"uint256",
			"address",
		],[
			this.EIP712DOMAIN_TYPEHASH,
			web3.utils.keccak256(domain.name),
			web3.utils.keccak256(domain.version),
			domain.chainId,
			domain.verifyingContract,
		]));
	},
	GMTXStructHash: function(gmtx)
	{
		return web3.utils.keccak256(web3.eth.abi.encodeParameters([
			"bytes32",
			"bytes32",
			"uint256",
			"uint256",
			"bytes32",
		],[
			this.GMTX_TYPEHASH,
			web3.utils.keccak256(gmtx.data),
			gmtx.value,
			gmtx.nonce,
			gmtx.salt,
		]));
	},

	/* ERC712 composition */
	typedStructHash: function(hash)
	{
		return web3.utils.soliditySha3(
			{ t: 'bytes',   v: "0x1901"                    },
			{ t: 'bytes32', v: this.EIP712DOMAIN_SEPARATOR },
			{ t: 'bytes32', v: hash                        },
		)
	},

	/* signature schemes */
	signStruct: function(struct, hash, key)
	{
		sig = ethUtil.ecsign(Buffer.from(hash.substr(2), 'hex'), key);
		struct.sign = '0x' +
		[ ethUtil.bufferToHex(sig.r).substr(2)
		, ethUtil.bufferToHex(sig.s).substr(2)
		, ethUtil.bufferToHex(sig.v).substr(2)
		].join('');
		return struct;
	},

	/* wrappers */
	GMTXTypedStructHash: function (gmtx) { return this.typedStructHash(this.GMTXStructHash(gmtx)); },
	signGeneralizedMetaTX: function(gmtx, key) { return this.signStruct(gmtx, this.GMTXTypedStructHash(gmtx), key); },

};
