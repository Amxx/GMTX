import React from 'react';
import { ApolloProvider } from '@apollo/react-hooks';
import { ApolloClient   } from 'apollo-client';
import { InMemoryCache  } from 'apollo-cache-inmemory';
import { HttpLink       } from 'apollo-link-http';

class ApolloWrapper extends React.Component
{
	state = { client: null }

	componentDidMount()
	{
		this.configure(this.props.uri);
	}

	componentWillReceiveProps(nextProps)
	{
		this.configure(nextProps.uri);
	}

	configure(uri)
	{
		const cache  = new InMemoryCache();
		const link   = new HttpLink({ uri });
		const client = new ApolloClient({ cache, link });
		this.setState({ client });
	}

	render()
	{
		return (
			this.state.client &&
			<ApolloProvider client={this.state.client}>
				{this.props.children}
			</ApolloProvider>
		);
	}
}

export default ApolloWrapper;
