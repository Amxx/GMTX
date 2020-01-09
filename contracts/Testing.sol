pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import './GMTXReceiver.sol';


contract Testing is GMTXReceiver
{
	address public lastSender;
	address public lastAccount;

	function test(address account) external withMetaTx(account)
	{
		lastSender = msg.sender;
		lastAccount = account;
	}
}
