var vote = artifacts.require("Voting");

module.exports = function(deployer) {
	deployer.deploy(vote);
}