pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '../GMTXReceiver.sol';


contract Testing is GMTXReceiver
{
	event Test(address msgsender, address sender, string details);

	constructor() public GMTXReceiver(false) {}

	function test(string calldata details) external
	{
		emit Test(msg.sender, _msgSender(), details);
	}
}
