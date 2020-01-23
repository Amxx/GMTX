pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


contract ERC712Base
{
	// bytes32 internal constant EIP712DOMAIN_TYPEHASH = keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));
	bytes32 internal constant EIP712DOMAIN_TYPEHASH = 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f;
	string  internal m_name;
	string  internal m_version;

	struct EIP712Domain
	{
		string  name;
		string  version;
		uint256 chainId;
		address verifyingContract;
	}

	constructor(string memory name, string memory version)
	internal
	{
		m_name    = name;
		m_version = version;
	}

	function _chainID()
	internal pure returns(uint256 id)
	{
		assembly { id := chainid() }
	}

	function _domain()
	internal view returns(EIP712Domain memory)
	{
		return EIP712Domain({
			name:              m_name
		, version:           m_version
		, chainId:           _chainID()
		, verifyingContract: address(this)
		});
	}

	function _hash(EIP712Domain memory domain)
	internal pure returns (bytes32 domainhash)
	{
		return keccak256(abi.encode(
			EIP712DOMAIN_TYPEHASH
		, keccak256(bytes(domain.name))
		, keccak256(bytes(domain.version))
		, domain.chainId
		, domain.verifyingContract
		));
	}

	function _toEthTypedStructHash(bytes32 _structHash, bytes32 _domainHash)
	internal pure returns (bytes32 typedStructHash)
	{
		return keccak256(abi.encodePacked("\x19\x01", _domainHash, _structHash));
	}
}
