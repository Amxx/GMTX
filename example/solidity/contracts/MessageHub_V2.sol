pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '../../../core/contracts/GMTXRecipient_V2.sol';


contract MessageHub_V2 is GMTXRecipient_V2
{
	event NewMessage(address sender, string message);

	constructor() public GMTXRecipient_V2(false) {}

	function publish(string calldata message) external
	{
		emit NewMessage(_msgSender(), message);
	}
}
