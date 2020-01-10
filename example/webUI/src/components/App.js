import React from "react";

import ContextProvider, { withContext } from './Context';

import Notifications from './Notifications';
import ChatBox       from './ChatBox';

class App extends React.Component
{
	render()
	{
		const WrappedNotifications = withContext(Notifications);
		const WrappedChatBox       = withContext(ChatBox);

		return (
			<ContextProvider>
				<WrappedNotifications/>
				<WrappedChatBox/>
			</ContextProvider>
		);
	}
}

export default App;
