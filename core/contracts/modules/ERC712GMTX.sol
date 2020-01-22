pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './ERC712Base.sol';


contract ERC712GMTX is ERC712Base
{
	bytes32 internal constant GMTX_TYPEHASH = keccak256(bytes("GMTX(address from,bytes data,uint256 gas,uint256 value,uint256 nonce,uint256 expiry,bytes32 salt)"));

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

	constructor()
	public ERC712Base("GeneralizedMetaTX", "0.0.1-beta.1")
	{}

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
}
