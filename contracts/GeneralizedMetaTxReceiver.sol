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

		// check ordering
		m_nonce[_metatx.sender]++;
		require(_metatx.nonce == 0 || _metatx.nonce == m_nonce[_metatx.sender], "invalid-nonce");

		// check replay
		require(!m_replay[digest], 'replay-prevention');
		m_replay[digest] = true;

		// check value
		require(_metatx.value == msg.value, 'invalid-value');

		// check signature
		require(_checkSignature(_metatx.sender, digest, _signature), 'invalid-signature');

		// forward call
		(bool success, bytes memory returndata) = address(this).call.value(msg.value)(abi.encodePacked(
			_metatx.selector,
			abi.encode(_metatx.sender),
			_metatx.extradata
		));

		// revert on failure
		if (!success)
		{
			revert(string(returndata));
		}
	}
}
