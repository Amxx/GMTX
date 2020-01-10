pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '../GMTXReceiver.sol';


contract TestingMirror is GMTXReceiver
{
	event Test(address msgsender, address sender, string details);

	constructor() public GMTXReceiver(true) {}

	function test(string calldata details) external
	{
		emit Test(msg.sender, _msgSender(), details);
	}
}
