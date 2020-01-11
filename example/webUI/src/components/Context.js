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

	gmtx_sign = (gmtx) => {
		// sanitize
		const sgmtx = {
			value:  0,
			nonce:  0,
			expiry: 0,
			salt:   ethers.utils.hexlify(ethers.utils.randomBytes(32)),
			...gmtx,
		};
		// produce signature
		return new Promise((resolve, reject) => {
			// retreive domain
			this.state.contract.domain()
			.then(domain => {
				// build data
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
						sender: sgmtx.sender.toString(),
						data:   sgmtx.data,
						value:  sgmtx.value.toString(),
						nonce:  sgmtx.nonce.toString(),
						expiry: sgmtx.expiry.toString(),
						salt:   sgmtx.salt.toString(),
					}
				});
				// call eth_signTypedData_v3
				this.state.signer.provider.sendAsync({
					method: "eth_signTypedData_v3",
					params: [sgmtx.sender, data],
				}, (error, result) => {
					error ? reject(error) : resolve({ gmtx: sgmtx, signature: result.result })
				})
			})
			.catch(reject);
		})
	}

	gmtx_relay = (gmtx, signature) => {
		return this.state.contract.receiveMetaTx(gmtx, signature);
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
