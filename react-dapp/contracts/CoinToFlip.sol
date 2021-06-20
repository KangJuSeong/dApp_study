// < 설계 >
// 1. 유저가 동전의 앞뒤를 선택하고 이더 베팅(베팅 취소 가능 -> 수수료 차감)
// 2. 장부에 베팅 정보 기록
// 3. 동전 던지기 실행(난수 사용)
// 4. 베팅한 동전이 나오면 유저 주소로 수수료를 제외한 이더 송금
// 5. 장부에 베팅 정보 리셋

pragma solidity ^0.4.24;

contract CoinToFlip {
	uint constant MAX_CASE = 2;
	uint constant MIN_BET = 0.01 ether;
	uint constant MAX_BET = 10 ether;
	uint constant HOUSE_FEE_PERCENT = 5;
	uint constant HOUSE_MIN_FEE = 0.005 ether;
	
	adress public owner;
	uint public lockedInBets;
	
	struct Bet {
		uint amount;
		uint8 numOfBetBit;
		uint placeBlockNumber;
	}
}