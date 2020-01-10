import React from "react";
import { EventEmitter } from 'fbemitter';
import { ethers } from 'ethers';

import config     from '../config/config';
import MessageHub from '../abis/MessageHub.json';

export const Context = React.createContext({});

const TYPES = {
	EIP712Domain:
	[
		{ name:"name",              type: "string"  },
		{ name:"version",           type: "string"  },
		{ name:"chainId",           type: "uint256" },
		{ name:"verifyingContract", type: "address" },
	],
	GMTX:
	[
		{ name: "sender", type: "address" },
		{ name: "data",   type: "bytes"   },
		{ name: "value",  type: "uint256" },
		{ name: "nonce",  type: "uint256" },
		{ name: "expiry", type: "uint256" },
		{ name: "salt",   type: "bytes32" },
	]
}

class ContextProvider extends React.Component
{
	constructor(props)
	{
		super(props);
		// silent warning
		window.ethereum.autoRefreshOnNetworkChange = false;
		// initialize state
		this.state = {
			// variables
			emitter:    new EventEmitter(),
			signer:     new ethers.providers.Web3Provider(window.ethereum),
			config:     config,
			contracts:  {},
			// methods
			getNetwork: this.getNetwork,
			getWallet:  this.getWallet,
			GMTX: {
				sanitize: this.gmtx_sanitize,
				sign:     this.gmtx_sign,
				relay:    this.gmtx_relay,
			}
		}
	}

	componentDidMount()
	{
		window.ethereum.enable()
		.then(() => {
			this.start().then(() => {
				window.ethereum.on('networkChanged',  this.onNetworkChanged);
				window.ethereum.on('accountsChanged', this.onAccountsChanged);
			});
		});
	}

	componentWillUnmount()
	{
		this.stop();
	}

	start = () => new Promise(async (resolve, reject) => {
		try
		{
			const network  = this.getNetwork();
			const provider = ethers.getDefaultProvider(network.name);
			const wallet   = new ethers.Wallet(network.relayer, provider);
			const contract = new ethers.Contract(network.address, MessageHub.abi, wallet);
			this.setState({ contract, });

			// addListener

			// notify
			this.state.emitter.emit('Notify', 'success', 'Connection successfull');
		}
		catch
		{
			this.setState({ contracts: null });

			// notify
			this.state.emitter.emit('Notify', 'error', 'Please switch to goerli.', 'Service unavailable on this network');
		}
		resolve();
	})

	stop = () => new Promise(async (resolve, reject) => {
		if (this.state.connected)
		{
			// removeListener
		}
		resolve();
	})

	restart = () => new Promise((resolve, reject) => {
		this.stop()
		.then(() => {
			this.start()
			.then(resolve)
			.catch(reject);
		})
		.catch(reject);
	})

	onNetworkChanged = () => {
		this.state.emitter.emit('NetworkChanged');
		this.restart();
	}

	onAccountsChanged = () => {
		this.state.emitter.emit('AccountsChanged');
	}

	getNetwork = (chainId = window.ethereum.networkVersion) => {
		return { chainId, ...this.state.config.networks[chainId] };
	}

	getWallet = () => {
		return ethers.utils.getAddress(window.ethereum.selectedAddress);
	}

	gmtx_sanitize = (gmtx) => {
		return {
			value:  0,
			nonce:  0,
			expiry: 0,
			salt:   ethers.utils.hexlify(ethers.utils.randomBytes(32)),
			...gmtx,
		}
	}

	gmtx_sign = (gmtx) => {
		return new Promise((resolve, reject) => {
			this.state.contract.domain()
			.then(domain => {
				const from = this.state.signer.provider.selectedAddress
				const data = JSON.stringify({
					types:       TYPES,
					primaryType: "GMTX",
					domain:
					{
						name:              domain.name,
						version:           domain.version,
						chainId:           domain.chainId.toString(),
						verifyingContract: domain.verifyingContract,
					},
					message:
					{
						sender: gmtx.sender.toString(),
						data:   gmtx.data,
						value:  gmtx.value.toString(),
						nonce:  gmtx.nonce.toString(),
						expiry: gmtx.expiry.toString(),
						salt:   gmtx.salt.toString(),
					}
				});
				this.state.signer.provider.sendAsync({
					method: "eth_signTypedData_v4",
					params: [from, data ],
					from: from
				}, (error, result) => {
					error ? reject(error) : resolve(result.result)
				})
			})
			.catch(reject);
		})
	}

	gmtx_relay = (gmtx, signature) => {
		return this.state.contract.receiveMetaTx(gmtx, signature)
	}

	render() {
		return (
			<Context.Provider value={this.state}>
				{this.props.children}
			</Context.Provider>
		);
	}
}

export default ContextProvider;

export const withContext = Component => props => (
	<Context.Consumer>
		{ context => <Component {...props} context={context} /> }
	</Context.Consumer>
)
