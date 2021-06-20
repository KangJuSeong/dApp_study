var hello = artifacts.require("HelloWorld");


// async, await 을 이용한 테스트 코드 작성
contract("HelloWorld", function() {
	it("should be same as constructor argument", async () => {
		let instance = await hello.deployed();
		let greeting = await instance.say.call();
		assert.equal(greeting, "Hello, World!");
	});
	
	it("should change the greeting value by setGreeting", async () => {
		let instance = await hello.deployed();
		await instance.setGreeting("Hello, Test!", {from: web3.eth.accounts[0]});
		let greeting = await instance.say.call();
		assert.equal(greeting, "Hello, Test!");
	});
});