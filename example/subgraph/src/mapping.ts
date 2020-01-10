import {
	EthereumEvent,
} from '@graphprotocol/graph-ts'

import {
	NewMessage as NewMessageEvent,
} from '../generated/GMTX/MessageHub'

import {
	Account,
	Message,
} from '../generated/schema'

function createEventID(event: EthereumEvent): string
{
	return event.block.number.toString().concat('-').concat(event.logIndex.toString());
}

export function handleNewMessage(ev: NewMessageEvent): void {
	let sender  = new Account(ev.params.sender.toHex());
	let message = new Message(createEventID(ev));

	message.sender    = sender.id;
	message.content   = ev.params.message;
	message.timestamp = ev.block.timestamp;

	sender.save();
	message.save();
}
