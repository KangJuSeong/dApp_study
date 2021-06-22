const coinToFlip = artifacts.require("CoinToFlip");


contract("CoinToFlip", (accounts) => {
	
	// kill 메서드에 대한 테스트
	it("self-destruct should be executed by ONLY owner", async () => {
		let instance = await coinToFlip.deployed();
		
		try {
			await instance.kill({from: accounts[9]}); // 배포자가 아닌 사람이 kill을 사용하면 에러 발생이 정상
		} catch (e) {
			var err = e;
		}
		assert.isOk(err instanceof Error, "Anyone can kill the contract");
	});
	
	// 5이더를 컨트랙트로 전송했을 경우 테스트
	it("should have initial fund", async () => {
		let instance = await coinToFlip.deployed();
		let tx = await instance.sendTransaction({from: accounts[9], value: web3.toWei(5, "ether")});
		let bal = await web3.eth.getBalance(instance.address);
		assert.equal(await web3.fromWei(bal, "ether").toString(), "5", "House does not have enough fund");
	});
	
	// 0.1 ETH를 베팅하면 컨트랙트의 잔액은 5.1 ETH가 되야하는 테스트
	it("should have normal bet", async () => {
		let instance = await coinToFlip.deployed();
		
		const val = 0.1;
		const mask = 1;
		
		await instance.placeBet(mask, {from: accounts[3], value: web3.toWei(val, "ether")});
		let bal = await web3.eth.getBalance(instance.address);
		assert.equal(await web3.fromWei(bal, "ether").toString(), "5.1", "placeBet is failed");
	});
	
	// 플레이어는 베팅을 연속 두번하지 못하는 테스트
	it("should have only one bet at a time", async () => {
		let instance = await coinToFlip.deployed();
		
		const val = 0.1;
		const mask = 1;
		try {
			await instance.placeBet(mask, {from: accounts[3], value: web3.toWei(val, "ether")});
			
		} catch (error) {
			var err = error;
		}
		assert.isOk(err instanceof Error, "Player can bet more than two");
	});
})