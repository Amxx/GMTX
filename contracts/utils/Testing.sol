pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '../GMTXReceiver.sol';


contract Testing is GMTXReceiver
{
	address public lastMsgSender;
	address public lastSender;
	address public lastAccount;

	function test(address account) external
	{
		lastMsgSender = msg.sender;
		lastSender    = _msgSender();
		lastAccount   = account;
	}
}
