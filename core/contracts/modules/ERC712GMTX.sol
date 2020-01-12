pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './ERC712Base.sol';


contract ERC712GMTX is ERC712Base
{
	// bytes32 internal constant GMTX_TYPEHASH = keccak256(bytes("GMTX(address sender,bytes data,uint256 value,uint256 nonce,uint256 expiry,bytes32 salt)"));
	bytes32 internal constant GMTX_TYPEHASH = 0x6372f79a8ff532f83e3c0945df9c5971df69b2d99e7f8840632a34d1b145db4f;

	struct GMTX
	{
		address sender;
		bytes   data;
		uint256 value;
		uint256 nonce;
		uint256 expiry;
		bytes32 salt;
	}

	constructor()
	public ERC712Base("GeneralizedMetaTX", "0.0.1-beta.1")
	{}

	function _hash(GMTX memory _metatx)
	internal pure returns (bytes32 metatxhash)
	{
		return keccak256(abi.encode(
			GMTX_TYPEHASH
		, _metatx.sender
		, keccak256(_metatx.data)
		, _metatx.value
		, _metatx.nonce
		, _metatx.expiry
		, _metatx.salt
		));
	}
}
