pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import 'gmtx-solidity/contracts/GMTXRecipient.sol';


contract GasRepayer2 is ERC20, ERC20Detailed, GMTXRecipient
{
	using SafeMath for uint256;

	uint256 constant internal FLAT_GAS_USAGE = 120140;

	constructor()
	public
	GMTXRecipient(false)
	ERC20Detailed("GasRepayerToken2", "GRT2", 18)
	{}

	function relayAndRepay(address target, GMTX memory metatx, bytes memory signature, uint256 gasPrice)
	public payable
	{
		uint256         gasBefore = gasleft();
		address payable repayer   = _msgSender();
		address payable relayer   = _msgRelayer();

		GMTXRecipient(target).receiveMetaTx(metatx, signature);

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
