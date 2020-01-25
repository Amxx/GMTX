pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './ERC712Base.sol';


contract ERC712GMTX_V2 is ERC712Base
{
	bytes32 internal constant GMTXCORE_TYPEHASH    = keccak256(bytes("GMTXCore(bytes data,uint256 gas,uint256 value)"));
	bytes32 internal constant GMTXDETAILS_TYPEHASH = keccak256(bytes("GMTXDetails(address from,uint256 nonce,uint256 expiry,bytes32 salt)"));
	bytes32 internal constant GMTXv2_TYPEHASH      = keccak256(bytes("GMTXv2(GMTXCore[] txs,GMTXDetails details)GMTXCore(bytes data,uint256 gas,uint256 value)GMTXDetails(address from,uint256 nonce,uint256 expiry,bytes32 salt)"));

	struct GMTXCore
	{
		bytes   data;
		uint256 gas;
		uint256 value;
	}
	struct GMTXDetails
	{
		address from;
		uint256 nonce;
		uint256 expiry;
		bytes32 salt;
	}
	struct GMTXv2
	{
		GMTXCore[]  txs;
		GMTXDetails details;
	}

	constructor(string memory name, string memory version)
	internal ERC712Base(name, version)
	{}

	function _hash(bytes32[] memory array)
	internal pure returns (bytes32)
	{
		return keccak256(abi.encodePacked(array));
	}

	function _hash(GMTXCore memory gmtxcore)
	internal pure returns (bytes32)
	{
		return keccak256(abi.encode(
			GMTXCORE_TYPEHASH
		,	keccak256(gmtxcore.data)
		,	gmtxcore.gas
		,	gmtxcore.value
		));
	}

	function _hash(GMTXDetails memory gmtxdetails)
	internal pure returns (bytes32)
	{
		return keccak256(abi.encode(
			GMTXDETAILS_TYPEHASH
		,	gmtxdetails.from
		,	gmtxdetails.nonce
		,	gmtxdetails.expiry
		,	gmtxdetails.salt
		));
	}


	function _hash(GMTXv2 memory gmtx)
	internal pure returns (bytes32)
	{
		bytes32[] memory array = new bytes32[](gmtx.txs.length);

		for (uint256 i = 0; i < gmtx.txs.length; ++i)
		{
			array[i] = _hash(gmtx.txs[i]);
		}

		return keccak256(abi.encode(
			GMTXv2_TYPEHASH
		,	_hash(array)
		,	_hash(gmtx.details)
		));
	}
}
