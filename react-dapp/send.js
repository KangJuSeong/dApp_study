// 메타마스크로 만든 내 계정으로 이더 보내는 자동 스크립트 작성
module.exports = (callback) => {
	// ganache에 있는 10번째 계졍의 이더를 메타마스크로 만든 내 계정으로 30 이더 보내기
	web3.eth.sendTransaction({from: web3.eth.accounts[9], to: "0xDeaCA98CEf52b482dBADEC32f03396757f27F431", value: web3.toWei(30, "ether")}, callback);
}