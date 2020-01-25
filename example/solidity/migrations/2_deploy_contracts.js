module.exports = function(deployer) {
	deployer.deploy(artifacts.require("MessageHub"));
	deployer.deploy(artifacts.require("GasRepayer"));
	deployer.deploy(artifacts.require("GasRepayer2"));

	deployer.deploy(artifacts.require("MessageHub_V2"));
};
