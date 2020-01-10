var MessageHub = artifacts.require("MessageHub");

module.exports = function(deployer) {
	deployer.deploy(MessageHub);
};
