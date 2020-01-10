pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './modules/SignatureVerifier.sol';
import './modules/ERC712GMTX.sol';

contract GMTXMirror
{
	function () payable external
	{
		address(msg.sender).call.value(msg.value)(msg.data);
	}
}

contract GMTXReceiver is SignatureVerifier, ERC712GMTX
{
	address                     public gmtx_mirror;
	mapping(bytes32 => bool   ) public gmtx_replay;
	mapping(address => uint256) public gmtx_nonce;

	event GMTXReceived(bytes32 hash);

	constructor(bool useMirror)
	public
	{
		if (useMirror)
		{
			gmtx_mirror = address(new GMTXMirror());
		}
		else
		{
			gmtx_mirror = address(this);
		}
	}

	function receiveMetaTx(GMTX memory _metatx, bytes memory _signature) public payable
	{
		bytes32 digest = _toEthTypedStructHash(_hash(_metatx), _hash(domain()));

		// check signature
		require(_checkSignature(_metatx.sender, digest, _signature), 'GMTX/invalid-signature');

		// check ordering
		gmtx_nonce[_metatx.sender]++;
		require(_metatx.nonce == 0 || _metatx.nonce == gmtx_nonce[_metatx.sender], 'GMTX/invalid-nonce');

		// check replay protection
		require(!gmtx_replay[digest], 'GMTX/replay-prevention');
		gmtx_replay[digest] = true;

		// check expiry
		require(_metatx.expiry == 0 || _metatx.expiry > now, 'GMTX/expired');

		// check value
		require(_metatx.value == msg.value, 'GMTX/invalid-value');

		// forward call: msg.sender = address(this), real sender, is appended at the end of calldata
		(bool success, bytes memory returndata) = gmtx_mirror.call.value(msg.value)(abi.encodePacked(_metatx.data, _metatx.sender));

		if (success)
		{
			emit GMTXReceived(digest);
		}
		else
		{
			revert(string(returndata));
		}
	}

	function _msgSender()
	internal view returns (address payable sender)
	{
		return (msg.sender == gmtx_mirror) ? _getRelayedSender() : msg.sender;
	}

	function _getRelayedSender()
	internal pure returns (address payable sender)
	{
		bytes memory data   = msg.data;
		uint256      length = msg.data.length;
		assembly { sender := and(mload(add(data, length)), 0xffffffffffffffffffffffffffffffffffffffff) }
	}
}