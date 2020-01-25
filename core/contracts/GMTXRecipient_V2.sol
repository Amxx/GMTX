pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/math/SafeMath.sol';
import './modules/SignatureVerifier.sol';
import './modules/ERC712GMTX_V2.sol';

contract GMTXMirror
{
	function () payable external
	{
		(bool success, bytes memory returnData) = address(msg.sender).call.value(msg.value)(msg.data);
		require(success, string(returnData));
	}
}

contract GMTXRecipient_V2 is SignatureVerifier, ERC712GMTX_V2
{
	using SafeMath for uint256;

	address                     public gmtx_mirror;
	mapping(bytes32 => bool   ) public gmtx_replay;
	mapping(address => uint256) public gmtx_nonce;

	event GMTXReceived(bytes32 digest, uint256 index);

	constructor(bool useMirror)
	public ERC712GMTX_V2("GeneralizedMetaTX", "0.0.1-beta.2")
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

	function receiveMetaTx(GMTXv2 memory _metatx, bytes memory _signature)
	public payable
	{
		bytes32 digest = _toEthTypedStructHash(_hash(_metatx), _hash(_domain()));

		uint256 value = 0;
		for (uint256 i = 0; i < _metatx.txs.length; ++i)
		{
			value = value.add(_metatx.txs[i].value);
		}

		_preflightReplay   (digest);
		_preflightSignature(_metatx.details.from, digest, _signature);
		_preflightNonce    (_metatx.details.from, _metatx.details.nonce);
		_preflightExpiry   (_metatx.details.expiry);
		_preflightValue    (value);

		for (uint256 i = 0; i < _metatx.txs.length; ++i)
		{
			_relay(_metatx.details.from, _metatx.txs[i], digest, i);
		}
	}

	function _relay(address _from, GMTXCore memory _metacore, bytes32 _digest, uint256 _id)
	internal
	{
		(bool success, bytes memory returndata) = gmtx_mirror.call.gas(_metacore.gas).value(_metacore.value)(abi.encodePacked(_metacore.data, msg.sender, _from));
		if (success)
		{
			emit GMTXReceived(_digest, _id);
		}
		else
		{
			// TODO: might be better to not revert?
			revert(string(returndata));
		}
	}

	function _preflightReplay(bytes32 _digest)
	internal
	{
		require(!gmtx_replay[_digest], 'GMTX/replay-prevention');
		gmtx_replay[_digest] = true;
	}

	function _preflightSignature(address _from, bytes32 _digest, bytes memory _signature)
	internal view
	{
		require(_checkSignature(_from, _digest, _signature), 'GMTX/invalid-signature');
	}

	function _preflightValue(uint256 _value)
	internal view
	{
		require(_value == msg.value, 'GMTX/invalid-value');
	}

	function _preflightNonce(address _from, uint256 _nonce)
	internal
	{
		gmtx_nonce[_from]++;
		require(_nonce == 0 || _nonce == gmtx_nonce[_from], 'GMTX/invalid-nonce');
	}

	function _preflightExpiry(uint256 _expiry)
	internal view
	{
		require(_expiry == 0 || _expiry > now, 'GMTX/expired');
	}

	function _msgSender()
	internal view returns (address payable sender)
	{
		return (msg.sender == gmtx_mirror) ? _extractSender() : msg.sender;
	}

	function _msgRelayer()
	internal view returns (address payable sender)
	{
		return (msg.sender == gmtx_mirror) ? _extractRelayer() : msg.sender;
	}

	function _extractSender()
	internal pure returns (address payable sender)
	{
		bytes memory data   = msg.data;
		uint256      length = msg.data.length;
		assembly { sender := and(mload(sub(add(data, length), 0x00)), 0xffffffffffffffffffffffffffffffffffffffff) }
	}

	function _extractRelayer()
	internal pure returns (address payable relayer)
	{
		bytes memory data   = msg.data;
		uint256      length = msg.data.length;
		assembly { relayer := and(mload(sub(add(data, length), 0x14)), 0xffffffffffffffffffffffffffffffffffffffff) }
	}

	function gmtx_domain()
	public view returns(EIP712Domain memory)
	{
		return _domain();
	}
}
