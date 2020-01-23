pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './ERC712Base.sol';


contract ERC712GMTX is ERC712Base
{
	bytes32 internal constant GMTX_TYPEHASH      = keccak256(bytes("GMTX(address from,bytes data,uint256 gas,uint256 value,uint256 nonce,uint256 expiry,bytes32 salt)"));
	bytes32 internal constant GMTXBATCH_TYPEHASH = keccak256(bytes("GMTXBatch(GMTX[] transactions)GMTX(address from,bytes data,uint256 gas,uint256 value,uint256 nonce,uint256 expiry,bytes32 salt)"));

	struct GMTX
	{
		address from;
		bytes   data;
		uint256 gas;
		uint256 value;
		uint256 nonce;
		uint256 expiry;
		bytes32 salt;
	}

	struct GMTXBatch
	{
		GMTX[] transactions;
	}

	constructor(string memory name, string memory version)
	internal ERC712Base(name, version)
	{}

	function _hash(bytes32[] memory array)
	internal pure returns (bytes32 arrayhash)
	{
		return keccak256(abi.encodePacked(array));
	}

	function _hash(GMTX memory metatx)
	internal pure returns (bytes32 metatxhash)
	{
		return keccak256(abi.encode(
			GMTX_TYPEHASH
		, metatx.from
		, keccak256(metatx.data)
		, metatx.gas
		, metatx.value
		, metatx.nonce
		, metatx.expiry
		, metatx.salt
		));
	}

	function _hash(GMTXBatch memory metatxs)
	internal pure returns (bytes32 metatxshash)
	{
		bytes32[] memory metatx_hashes = new bytes32[](metatxs.transactions.length);

		for (uint256 i = 0; i < metatxs.transactions.length; ++i)
		{
			metatx_hashes[i] = _hash(metatxs.transactions[i]);
		}

		return keccak256(abi.encode(
			GMTXBATCH_TYPEHASH
		, _hash(metatx_hashes)
		));
	}
}
