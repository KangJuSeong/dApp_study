// 배포 스크립트
var hello = artifacts.require("HelloWorld");

module.exports = function(deployer) {
	// HelloWorld.sol 에서 생성자에서 처음 들어가는 인자 넣어주기 (string _greeting)
	deployer.deploy(hello, "Hello World!");
}