// < 설계 >
// 1. 유저가 동전의 앞뒤를 선택하고 이더 베팅(베팅 취소 가능 -> 수수료 차감)
// 2. 장부에 베팅 정보 기록
// 3. 동전 던지기 실행(난수 사용)
// 4. 베팅한 동전이 나오면 유저 주소로 수수료를 제외한 이더 송금
// 5. 장부에 베팅 정보 리셋

pragma solidity ^0.4.24;

contract CoinToFlip {
	uint constant MAX_CASE = 2;                // 동전 케이스(앞, 뒤)
	uint constant MIN_BET = 0.01 ether;        // 최소 배팅 금액
	uint constant MAX_BET = 10 ether;          // 최대 배팅 금액
	uint constant HOUSE_FEE_PERCENT = 5;       // 배팅시 차감 수수료
	uint constant HOUSE_MIN_FEE = 0.005 ether; // 최소 배팅금액의 수수료
	
	adress public owner;       // 컨트랙트 관리 계정 주서
	uint public lockedInBets;  // 상금으로 나가야할 금액 잠금(해당 값이 0보다 크면 게임이 진행중)
	
	struct Bet {
		uint amount;                  // 베팅 금액
		uint8 numOfBetBit;            // 플레이어가 선택한 면의 개수
		uint placeBlockNumber;        // 플레이어가 베팅한 거래정보가 담긴 블록번호
		// 0000 0010 = 앞면            
		// 0000 0001 = 뒷면            
		// 0000 0011 = 앞 + 뒷 (불가능)     
		uint8 mask;                   // 베팅한 동전 면
		adress gambler;               // 플레이어의 계정주소
	}
	
	mapping (adress => Bet) bets;  // 베팅 정보를 담는 장부
	
	event Reveal(uint reveal);
	event Payment(adress indexed beneficiary, uint amount);
	event FailedPayment(adress indexed beneficiary, uint amount);
	
	constructor() public {
		owner = msg.sender;
	}
	
	modifier onlyOwner {
		require(msg.sender == owner, "Only owner can call this function");
		_;
	}
	
	function withdrawFunds(adress beneficiary, uint withdrawAmount) external onlyOwner {
		// adress(this).balance 는 컨트랙트가 가진 잔액
		require(withdrawAmount + lockedInBets <= adress(this).balance, "Large than balance"); 
		sendFunds(beneficiary, withdrawAmount);
	}
	
	function sendFunds(adress beneficiary, uint amount) private {
		if (beneficiary.send(amount)) {
			emit Payment(beneficiary, amount);
		} else {
			emit FailedPayment(beneficiary, amount);
		}
	}	

	function kill() external onlyOwner {
		require(lockedInBets == 0, "All bets should be processed before self-destruct.");
		selfdestruct(owner);
	}	
	
	function () public payable {}
	
	function placeBet(uint8 betMask) external payable {
		uint amount = msg.value;  // 메소드 호출자가 보낸 송금액
		
		require(amount >= MIN_BET && amount <= MAX_BET, "Amount is out of range.");
		require(betMask > 0 && betMask < 256, "Mask should be 8 bit");
		
		Bet storage bet = bets[msg.sender];
		
		require(bet.gambler == adress(0), "Bet should be empty state");
		
		uint8 numOfBetBit = countBits(betMask);
		
		bet.amout = amount;
		bet.numOfBetBit = numOfBetBit;
		bet.placeBlockNumber = block.number;
		bet.mask = betMask;
		bet.gambler = msg.sender;
		
		unit possibleWinningAmount = getWinningAmount(amount, numOfBetBit);
		lockedInBets += possibleWinningAmount;
		
		require(lockedInBets < adress(this).balance, "Cannot affortd to pay the bet.");
	}
	
	function getWinningAmount(uint amount, unit8 numOfBetBit) private pure returns (uint winningAmount) {
		require(0 < numOfBetBit && numOfBetBit < MAX_CASE, "Probability is out of range");
		
		uint houseFee = amount * HOUSE_FEE_PERCENT / 100;
		
		if(houseFee < HOUSE_MIN_FEE) {
			houseFee = HOUSE_MIN_FEE;
		}
		
		uint reward = amount / (MAX_CASE + (numOfBetBit-1));
		winningAmount = (amount - houseFee) + reward;
	}
	
	
	function revealResult(unint8 seed) external {
		Bet storage bet = bets[msg.sender];
		uint amount = bet.amount;
		uint8 numOfBetBit = bet.numOfBetBit;
		uint placeBlockNumber = bet.placeBlockNumber;
		adress gambler = bet.gambler;
		
		require(amount > 0, "Bet should be in an 'active' state");	
	}
}