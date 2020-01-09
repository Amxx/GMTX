pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './ERC712Base.sol';


contract ERC712GeneralizedMetaTx is ERC712Base
{
	bytes32 public constant GENERALIZEDMETATX_TYPEHASH = keccak256(bytes("GeneralizedMetaTX(address sender,uint256 value,bytes4 selector,bytes extradata)"));
	// bytes32 public constant GENERALIZEDMETATX_TYPEHASH = ;

	struct GeneralizedMetaTX
	{
		address sender;
		uint256 value;
		bytes4  selector;
		bytes   extradata;
	}

	constructor()
	public ERC712Base("GeneralizedMetaTX", "0.0.1-beta.1")
	{}

	function _hash(GeneralizedMetaTX memory _metatx)
	internal pure returns (bytes32 metatxhash)
	{
		return keccak256(abi.encode(
			GENERALIZEDMETATX_TYPEHASH
		, _metatx.sender
		, _metatx.value
		, _metatx.selector
		, _metatx.extradata
		));
	}
}
