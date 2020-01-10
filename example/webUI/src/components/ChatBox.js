import React from 'react';
import { animateScroll } from "react-scroll";

import ApolloWrapper from './ApolloWrapper';
import Messages      from './Messages';

import './ChatBox.css';

class ChatBox extends React.Component
{
	componentDidMount()
	{
		setInterval(() => this.scrollToBottom(), 1000);
	}

	scrollToBottom()
	{
		animateScroll.scrollToBottom({ containerId: "scrollToBottom" });
	}

	handleSubmit(event)
	{
		event.preventDefault();

		const gmtx = this.props.context.GMTX.sanitize({
			sender: this.props.context.getWallet(),
			data:   this.props.context.contract.interface.functions.publish.encode([event.target[0].value])
		});

		this.props.context.GMTX.sign(gmtx)
		.then(signature => {
			this.props.context.emitter.emit("Notify", "info", "Sending meta transaction to relayer...","Meta transaction succesfully signed");
			this.props.context.GMTX.relay(gmtx, signature)
			.then(() => {
				this.props.context.emitter.emit("Notify", "success", "", "Meta transaction succesfully relayed");
			})
			.catch(error => {
				this.props.context.emitter.emit("Notify", "error", JSON.stringify(error), "Error during relaying");
				console.error("RELAY ERROR:", error);
			})
		})
		.catch(error => {
			this.props.context.emitter.emit("Notify", "error", JSON.stringify(error), "Error during signature");
			console.error("SIGNATURE ERROR:", error);
		});

		event.target[0].value = "";
	}

	render()
	{
		return (
			<ApolloWrapper uri={this.props.context.getNetwork().thegraph}>
				<div className="chat">
					<div className="chat-title">
						<h1>GMTX Showcase</h1>
						<h2>A metatransaction powered chatbox</h2>
					</div>
					<Messages/>
					<div className="message-box">
						<form onSubmit={this.handleSubmit.bind(this)}>
							<textarea type="text" className="message-input" placeholder="Type message..."></textarea>
							<button type="submit" className="message-submit">Send</button>
						</form>
					</div>
				</div>
			</ApolloWrapper>
		);
	}
}

export default ChatBox;
