pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/GSN/GSNRecipient.sol';
import './GMTXRecipient.sol';

/**
 * @dev Hybrid between the GMTXRecipient and the GSN recipient contracts.
 *
 * TIP: This contract is abstract. The functions {acceptRelayedCall},
 *  {_preRelayedCall}, and {_postRelayedCall} are not implemented and must be
 * provided by derived contracts. See the
 * xref:ROOT:gsn-strategies.adoc#gsn-strategies[GSN strategies] for more
 * information on how to use the pre-built {GSNRecipientSignature} and
 * {GSNRecipientERC20Fee}, or how to write your own.
 */
contract GSNGMTXRecipient is GSNRecipient, GMTXRecipient
{
	constructor(bool useMirror)
	public GMTXRecipient(useMirror)
	{}

	function _msgSender()
	internal view returns (address payable sender)
	{
		return (msg.sender == gmtx_mirror) ? _extractSender() : GSNRecipient._msgSender();
	}

	function _msgRelayer()
	internal view returns (address payable sender)
	{
		return (msg.sender == gmtx_mirror) ? _extractRelayer() : GSNRecipient._msgSender();
	}

}
