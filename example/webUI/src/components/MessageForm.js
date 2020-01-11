import React from 'react';

class MessageForm extends React.Component
{
	handleSubmit(event)
	{
		event.preventDefault();

		this.props.context.GMTX.sign({
			sender: this.props.context.getWallet(),
			data:   this.props.context.contract.interface.functions.publish.encode([event.target[0].value])
		})
		.then(({gmtx, signature}) => {
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
			<div className="message-box">
				<form onSubmit={this.handleSubmit.bind(this)}>
					<input type="text" className="message-input" placeholder="Type message..."></input>
					<button type="submit" className="message-submit">Send</button>
				</form>
			</div>
		);
	}
}

export default MessageForm;
