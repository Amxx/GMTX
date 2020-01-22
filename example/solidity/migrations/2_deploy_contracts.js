var GasRepayer = artifacts.require("GasRepayer");
var MessageHub = artifacts.require("MessageHub");

module.exports = function(deployer) {
	deployer.deploy(GasRepayer);
	deployer.deploy(MessageHub);
};
