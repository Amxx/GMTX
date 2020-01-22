pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;


interface IERC1271
{
	function isValidSignature(bytes32, bytes calldata) external view returns (bytes4);
}

contract SignatureVerifier
{
	bytes4 constant internal ERC1271_MAGICVALUE = 0x20c13b0b;

	function _checkSignature(address identity, bytes32 hash, bytes memory signature)
	internal view returns (bool)
	{
		if (_isContract(identity))
		{
			return IERC1271(identity).isValidSignature(hash, signature) == ERC1271_MAGICVALUE;
		}
		else
		{
			return _recover(hash, signature) == identity;
		}
	}

	function _recover(bytes32 hash, bytes memory sign)
	internal pure returns (address)
	{
		bytes32 r;
		bytes32 s;
		uint8   v;

		if (sign.length == 65) // 65bytes: (r,s,v) form
		{
			assembly
			{
				r :=         mload(add(sign, 0x20))
				s :=         mload(add(sign, 0x40))
				v := byte(0, mload(add(sign, 0x60)))
			}
		}
		else if (sign.length == 64) // 64bytes: (r,vs) form → see EIP2098
		{
			assembly
			{
				r :=                mload(add(sign, 0x20))
				s := and(           mload(add(sign, 0x40)), 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
				v := shr(7, byte(0, mload(add(sign, 0x40))))
			}
		}
		else
		{
			revert("invalid-signature-format");
		}

		if (v < 27) v += 27;
		require(v == 27 || v == 28, "invalid-signature-v");
		return ecrecover(hash, v, r, s);
	}

	function _isContract(address addr)
	internal view returns (bool)
	{
		uint32 size;
		assembly { size := extcodesize(addr) }
		return size > 0;
	}
}
