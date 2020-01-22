import React from 'react';
import { NotificationContainer, NotificationManager } from 'react-notifications';

import 'react-notifications/lib/notifications.css';

class Notifications extends React.Component
{
	componentDidMount()
	{
		this.subscription_notify = this.props.context.emitter.addListener('Notify',         this.triggerNotification);
		this.subscription_reset  = this.props.context.emitter.addListener('NetworkChanged', this.triggerReset);
	}

	componentWillUnmount()
	{
		this.this.subscription_notify.remove();
		this.this.subscription_reset.remove();
	}

	triggerNotification = (type, message, title, duration = 3000, callback = () => {}) => {
		switch (type)
		{
			case 'info':    NotificationManager.info   (message, title, duration, callback); break;
			case 'success': NotificationManager.success(message, title, duration, callback); break;
			case 'warning': NotificationManager.warning(message, title, duration, callback); break;
			case 'error':   NotificationManager.error  (message, title, duration, callback); break;
			default:        console.error(`Unsupported notification format: ${type}`);       break;
		};
	};

	triggerReset = () => {
		NotificationManager.listNotify = [];
		NotificationManager.emitChange();
	};

	render()
	{
		return <NotificationContainer/>;
	}
}

export default Notifications;
