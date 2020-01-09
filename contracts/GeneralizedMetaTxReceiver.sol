pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './tools/SignatureVerifier.sol';
import './tools/ERC712GeneralizedMetaTx.sol';


contract GeneralizedMetaTxReceiver is SignatureVerifier, ERC712GeneralizedMetaTx
{
	mapping(bytes32 => bool   ) internal m_replay;
	mapping(address => uint256) internal m_nonce;

	modifier withMetaTx(address sender)
	{
		require(sender == msg.sender || address(this) == msg.sender);
		_;
	}

	function receiveMetaTx(GeneralizedMetaTX memory _metatx, bytes memory _signature) public payable
	{
		bytes32 digest = _toEthTypedStructHash(_hash(_metatx), _hash(domain()));
		address sender = _extract(_metatx.data);

		// check signature
		require(_checkSignature(sender, digest, _signature), 'GMTX/invalid-signature');

		// check ordering
		m_nonce[sender]++;
		require(_metatx.nonce == 0 || _metatx.nonce == m_nonce[sender], 'GMTX/invalid-nonce');

		// check replay protection
		require(!m_replay[digest], 'GMTX/replay-prevention');
		m_replay[digest] = true;

		// check expiry
		require(_metatx.expiry == 0 || _metatx.expiry > now, 'GMTX/expired');

		// check value
		require(_metatx.value == msg.value, 'GMTX/invalid-value');

		// forward call
		(bool success, bytes memory returndata) = address(this).call.value(msg.value)(abi.encodePacked(_metatx.data));

		// revert on failure
		if (!success)
		{
			revert(string(returndata));
		}
	}

	function _extract(bytes memory _data) internal pure returns (address sender)
	{
		assembly { sender := mload(add(_data, 0x24)) }
	}
}
