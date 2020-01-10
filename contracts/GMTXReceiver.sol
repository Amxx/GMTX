pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './modules/SignatureVerifier.sol';
import './modules/ERC712GMTX.sol';


contract GMTXReceiver is SignatureVerifier, ERC712GMTX
{
	mapping(bytes32 => bool   ) internal m_replay;
	mapping(address => uint256) internal m_nonce;

	function receiveMetaTx(GMTX memory _metatx, bytes memory _signature) public payable
	{
		bytes32 digest = _toEthTypedStructHash(_hash(_metatx), _hash(domain()));

		// check signature
		require(_checkSignature(_metatx.sender, digest, _signature), 'GMTX/invalid-signature');

		// check ordering
		m_nonce[_metatx.sender]++;
		require(_metatx.nonce == 0 || _metatx.nonce == m_nonce[_metatx.sender], 'GMTX/invalid-nonce');

		// check replay protection
		require(!m_replay[digest], 'GMTX/replay-prevention');
		m_replay[digest] = true;

		// check expiry
		require(_metatx.expiry == 0 || _metatx.expiry > now, 'GMTX/expired');

		// check value
		require(_metatx.value == msg.value, 'GMTX/invalid-value');

		// forward call: msg.sender = address(this), real sender, is appended at the end of calldata
		(bool success, bytes memory returndata) = address(this).call.value(msg.value)(abi.encodePacked(_metatx.data, _metatx.sender));

		// revert on failure
		if (!success)
		{
			revert(string(returndata));
		}
	}

	function _msgSender()
	internal view returns (address payable sender)
	{
		return (msg.sender == address(this)) ? _getMsgSender() : msg.sender;
	}

	function _getMsgSender()
	internal pure returns (address payable sender)
	{
		bytes memory data   = msg.data;
		uint256      length = msg.data.length;
		assembly { sender := and(mload(add(data, length)), 0xffffffffffffffffffffffffffffffffffffffff) }
	}
}
