pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '../GMTXReceiver.sol';


contract Testing is GMTXReceiver
{
	address public lastMsgSender;
	address public lastSender;

	event Test(address msgsender, address sender);

	constructor() public GMTXReceiver(true) {}

	function test() external
	{
		lastMsgSender = msg.sender;
		lastSender    = _msgSender();
		emit Test(msg.sender, _msgSender());
	}
}
