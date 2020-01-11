import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import { Identicon } from 'ethereum-react-components';

import graphql from '../graphql';

const Messages = (props) => {
	const { data, loading, error } = useQuery(graphql.messages, { pollInterval: 1000 })

	if (loading) { return null; }

	props.context.emitter.emit("NewMessage");

	return (
		<div className="messages">
			<div id="scrollToBottom" className="messages-content">
				{
					error ? (
						<div className="message new">
							{ error.toString() }
						</div>
					) : (
						data.messages.reverse().map((message, i) =>
							<div key={i} className="message new">
								<figure className="avatar">
									<Identicon address={message.sender.id} size="tiny" />
								</figure>
								{ message.content }
								<div className="timestamp">
									{ (new Date(message.timestamp*1000)).toTimeString().split(' ').find(Boolean) }
								</div>
							</div>
						)
					)
				}
			</div>
		</div>
	);
}

export default Messages;
