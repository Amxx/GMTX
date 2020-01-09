pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


interface IERC1271
{
	function isValidSignature(bytes32, bytes calldata) external view returns (bytes4);
}

contract SignatureVerifier
{
	bytes4 constant internal ERC1271_MAGICVALUE = 0x20c13b0b;

	function _checkSignature(address _identity, bytes32 _hash, bytes memory _signature)
	internal view returns (bool)
	{
		if (_isContract(_identity))
		{
			return IERC1271(_identity).isValidSignature(_hash, _signature) == ERC1271_MAGICVALUE;
		}
		else
		{
			return _recover(_hash, _signature) == _identity;
		}
	}

	function _recover(bytes32 hash, bytes memory sign)
	internal pure returns (address)
	{
		bytes32 r;
		bytes32 s;
		uint8   v;
		require(sign.length == 65);
		assembly
		{
			r :=         mload(add(sign, 0x20))
			s :=         mload(add(sign, 0x40))
			v := byte(0, mload(add(sign, 0x60)))
		}
		if (v < 27) v += 27;
		require(v == 27 || v == 28);
		return ecrecover(hash, v, r, s);
	}

	function _isContract(address _addr)
	internal view returns (bool)
	{
		uint32 size;
		assembly { size := extcodesize(_addr) }
		return size > 0;
	}
}
