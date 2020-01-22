pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import 'gmtx-solidity/contracts/GMTXReceiver.sol';


contract GasRepayer is ERC20, ERC20Detailed, GMTXReceiver
{
	using SafeMath for uint256;

	uint256 constant internal FLAT_GAS_USAGE = 119360;

	event CallOutcome(bool success, bytes returnData);

	constructor()
	public
	GMTXReceiver(false)
	ERC20Detailed("", "", 18)
	{}

	function relayAndRepay(address payable target, bytes calldata call, uint256 gasPrice)
	external payable
	{
		uint256         gasBefore = gasleft();
		address payable repayer   = _msgSender();
		address payable relayer   = _msgRelayer();

		if (target == address(this))
		{
			emit CallOutcome(false, bytes("self-calls-forbided"));
		}
		else
		{
			// TODO: append relayer and repayer (eq. sender) for an equivalent to GSN?
			// (bool success, bytes memory returnData) = target.call.value(msg.value).gas(gasAmount)(abi.encodePacked(call, relayer, repayer));
			(bool success, bytes memory returnData) = target.call.value(msg.value)(call);
			emit CallOutcome(success, returnData);
		}

		uint256 gasConsumed = gasBefore.sub(gasleft()).add(FLAT_GAS_USAGE);
		uint256 refund      = gasConsumed.mul(gasPrice);
		_withdraw(repayer, relayer, refund);
	}

	function ()
	external payable
	{
		_mint(_msgSender(), msg.value);
	}

	function mint()
	external payable
	{
		_mint(_msgSender(), msg.value);
	}

	function withdraw(uint256 amount)
	external
	{
		_withdraw(_msgSender(), _msgSender(), amount);
	}

	function _withdraw(address account, address payable target, uint256 amount)
	internal
	{
		(bool success, ) = target.call.value(amount)('');
		require(success, 'withdraw-faillure');
		_burn(account, amount);
	}
}
