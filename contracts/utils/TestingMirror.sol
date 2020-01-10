pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '../GMTXReceiver.sol';


contract TestingMirror is GMTXReceiver
{
	event NewMessage(address sender, string message);

	constructor() public GMTXReceiver(true) {}

	function test(string calldata message) external
	{
		emit NewMessage(_msgSender(), message);
	}
}
