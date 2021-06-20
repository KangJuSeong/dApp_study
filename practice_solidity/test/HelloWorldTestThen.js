var hello = artifacts.require("HelloWorld");


// then을 이용하여 테스트 코드 작성
contract("HelloWorld", function() {
	// it가 하나의 테스트 케이스
	it("should be same as constructor argument", () => {
		// hello가 배포되면, say()메서드가 실행되고 나면, greeting 변수를 받기
		return hello.deployed().then((instance) => {
			return instance.say().then((greeting) => {
				// greeting의 초기값이 잘 들어가 있는지 확인
				assert.equal(greeting, "Hello, World!");
			})
		})
	});
	
	it("should change the greeting value by setGreeting", function() {
		return hello.deployed().then((instance) => {
			// greeting 값을 Hello Test!로 변경하고 쓰기 메서드는 비용을 지불할 계정을 인자로 넣음
			instance.setGreeting("Hello, Test!", {from: web3.eth.accounts[0]}).then((result) => {
				return instance.say().then((greeting) => {
					// 바뀐 greeting의 값이 잘 들어갔는지 확인
					assert.equal(greeting, "Hello, Test!");
				})
			})
		})
	});
});