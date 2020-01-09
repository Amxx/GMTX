pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


contract ERC712Base
{
	bytes32 public constant EIP712DOMAIN_TYPEHASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
	string  public name;
	string  public version;

	struct EIP712Domain
	{
		string  name;
		string  version;
		uint256 chainId;
		address verifyingContract;
	}

	constructor(string _name, string _version)
	public
	{
		name    = _name;
		version = _version;
	}

	function chainID()
	public pure returns(uint256 id)
	{
		assembly { id := chainid() }
	}

	function domain()
	public view returns(EIP712Domain memory)
	{
		return EIP712Domain({
			name:              name
		, version:           version
		, chainId:           chainID()
		, verifyingContract: address(this)
		});
	}

	function _hash(EIP712Domain memory _domain)
	internal pure returns (bytes32 domainhash)
	{
		return keccak256(abi.encode(
			EIP712DOMAIN_TYPEHASH
		, keccak256(bytes(_domain.name))
		, keccak256(bytes(_domain.version))
		, _domain.chainId
		, _domain.verifyingContract
		));
	}

	function _toEthTypedStructHash(bytes32 _structHash, bytes32 _domainHash)
	internal pure returns (bytes32 typedStructHash)
	{
		return keccak256(abi.encodePacked("\x19\x01", _domainHash, _structHash));
	}
}
