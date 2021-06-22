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
		// 0000 0010 = 앞면 = 2           
		// 0000 0001 = 뒷면 = 1           
		// 0000 0011 = 앞 + 뒷 (불가능)     
		uint8 mask;                   // 베팅한 동전 면
		adress gambler;               // 플레이어의 계정주소
	}
	
	mapping (adress => Bet) bets;  // 베팅 정보를 담는 장부
	
	event Reveal(uint reveal);                                     // 던진 동전의 결과 이벤트 (1 or 2)
	event Payment(adress indexed beneficiary, uint amount);        // 상금 전송 이벤트 
	event FailedPayment(adress indexed beneficiary, uint amount);  // 상금 전송 실패 이벤트
	
	// 생성자, owner를 컨트랙트 배포 주소로 저장
	constructor() public {
		owner = msg.sender;
	}
	
	// 제어자, owner만 해당 함수를 실행 할 수 있도록 해줌
	modifier onlyOwner {
		require(msg.sender == owner, "Only owner can call this function");
		_;
	}
	
	// 컨트랙트에서 이더를 인출하는 메서드, owner만 호출 가능
	function withdrawFunds(adress beneficiary, uint withdrawAmount) external onlyOwner {
		// adress(this).balance 는 컨트랙트가 가진 잔액
		require(withdrawAmount + lockedInBets <= adress(this).balance, "Large than balance"); 
		sendFunds(beneficiary, withdrawAmount);
	}
	
	// 이더 전송 메서드, 플레이어에게 상금 전송 또는 이더 인출 역할
	function sendFunds(adress beneficiary, uint amount) private {
		// send 함수는 이더를 보내는 메서드로 전송이 성공하면 1, 실패하면 0을 리턴
		if (beneficiary.send(amount)) {
			emit Payment(beneficiary, amount);
		} else {
			emit FailedPayment(beneficiary, amount);
		}
	}	
	
	
	// 컨트랙트 종료 메서드
	function kill() external onlyOwner {
		// lockedInBets가 0이면 진행중인 게임이 없다는 뜻
		require(lockedInBets == 0, "All bets should be processed before self-destruct.");
		selfdestruct(owner);
	}	
	
	// fallback 함수 : 이름없는 함수, 파라미터, 리턴 값을 가질 수 없음. 컨트랙트에 하나만 존재 가능
	function () public payable {}  // 이 컨트랙트 주소에 이더를 송금하면 해당 함수가 실행되면서 컨트랙트에 이더가 송금됨 (초기 운영 자금)
	
	// 프론트에서 베팅을 했을 때 베팅 정보를 장부에 기록하는 메서드, payable 이 선언되어 있기 때문에 메서드를 실행할 때 이더를 같이 받을 수 있음
	function placeBet(uint8 betMask) external payable {
		uint amount = msg.value;  // 메소드 호출자가 보낸 송금액
		
		// 사용자가 베팅한 금액 조건 확인
		require(amount >= MIN_BET && amount <= MAX_BET, "Amount is out of range.");
		// 베팅한 동전 면의 값 조건 확인
		require(betMask > 0 && betMask < 256, "Mask should be 8 bit");
		
		// storage는 함수 내부에 선언된 로컬 변수가 레퍼런스 타입의 상태변수를 참조할 때 사용하는 키워드, 상태변수를 가르키는 포인터
		// storage를 안써도 되지만 명시해주지 않으면 컴파일 시 경고 발생
		Bet storage bet = bets[msg.sender];
		
		// 베팅 유저의 주소가 null인지 확인 (adress(0) 는 주소 null을 뜻함)
		require(bet.gambler == adress(0), "Bet should be empty state");
		
		// 베팅한 동전 면 계산
		uint8 numOfBetBit = countBits(betMask);
		
		// bet 구조체에 값을 채워넣기
		bet.amout = amount;
		bet.numOfBetBit = numOfBetBit;
		bet.placeBlockNumber = block.number;
		bet.mask = betMask;
		bet.gambler = msg.sender;
		
		// 유저가 동전을 맞췄을 때 보상으로 가져갈 이더 계산
		unit possibleWinningAmount = getWinningAmount(amount, numOfBetBit);
		// 맞췄을 때 보상으로 가져갈 이더를 lockedInBets에 더해서 해당 이더들을 잠금
		lockedInBets += possibleWinningAmount;
		
		// 현재 컨트랙트에 있는 이더보다 lockedInBets 가 더 크면 상금을 모두 줄 수 없는 경우를 확인 
		require(lockedInBets < adress(this).balance, "Cannot affortd to pay the bet.");
	}
	
	// 베팅한 금액에 대한 상금을 계산하는 메서드, pure는 계정의 상태 정보를 읽거나 쓰지 않을 때 사용(쓰지 않으면 컴파일때 경고 발생)
	function getWinningAmount(uint amount, unit8 numOfBetBit) private pure returns (uint winningAmount) {
		// 베팅한 동전 면의 값이 1 또는 2인지 확인
		require(0 < numOfBetBit && numOfBetBit < MAX_CASE, "Probability is out of range");
		
		// owner가 가져갈 수수료 계산
		uint houseFee = amount * HOUSE_FEE_PERCENT / 100;
		
		// 가져가는 수수료가 최소 수수료보다 작을 때는 지정해놓은 최소 수수료로 가져감
		if(houseFee < HOUSE_MIN_FEE) {
			houseFee = HOUSE_MIN_FEE;
		}
		
		// 베팅 보상 계산
		// 뒷면으로 맞춘 보상금이 더 큼
		uint reward = amount / (MAX_CASE + (numOfBetBit-1));
		winningAmount = (amount - houseFee) + reward;  // 최종 지급 상금
	}
	
	// 동전 던지기 메서드
	function revealResult(unint8 seed) external {
		// 유저의 베팅 정보 가져오기
		Bet storage bet = bets[msg.sender];
		uint amount = bet.amount;
		uint8 numOfBetBit = bet.numOfBetBit;
		uint placeBlockNumber = bet.placeBlockNumber;
		adress gambler = bet.gambler;
		
		// 베팅 금액이 0보다 커야함
		require(amount > 0, "Bet should be in an 'active' state");	
		
		// 베팅은 동전 던지기보다 먼저 발생 되어있어야 함
		// block.number는 현재 블록 번호, placeBlockNumber는 유저의 베팅 정보가 담긴 블록 번호
		// 따라서 placeBlockNumber의 값이 더 작아야지 먼저 생성된 블록임
		require(block.number > placeBlockNumber, "revealResult in the same block as placeBet, or before.");
		
		// 난수 생성
		bytes32 random = keccak256(abi.encodePacked(blockhash(block.number-sedd), blockhash(placeBlockNumber)));
		
		uint reveal = uint(random) % MAX_CASE; // 동전 던지기 결과, 0(뒤) or 1(앞) 
		
		uint winningAmount = 0;
		uint possibleWinningAmount = 0;
		// 보상금 계산
		possibleWinningAmount = getWinningAmount(amount, numOfBetBit);
		
		// 동전 면 맞추기를 성공했을 때
		if((2 ** reveal) & bet.mask != 0) {
			winningAmount = possibleWinningAmount;
		}
		
		// 동전 결과에 대한 이벤트 발생
		emit Reveal(2 ** reveal);	
		
		// 정답을 맞춘 유저에게 최종 보상금 전송
		if(winningAmount > 0) {
			sendFunds(gambler, winningAmount);
		}
		
		// 모든 보상금이 다 나갔으므로 잠겨있는 이더 빼주기
		lockedInBets -= possibleWinningAmount;
		// 해당 베팅 정보를 bets 테이블에서 제거
		clearBet(msg.sender);
	}
	
	// 해당 플레이어의 값을 모두 null로 초기화
	function clearBet(adress player) private {
		Bet storage bet = bets[player];
		
		if(bet.amount > 0) {
			return;
		}
		
		bet.amount = 0;
		bet.numOfBetBit = 0;
		bet.placeBlockNumber = 0;
		bet.mask = 0;
		bet.gambler = adress(0);
	}
	
	// 베팅 후 결과를 확인하지 않고 베팅 취소
	function refundBet() external {
		require(block.number > bet.placeBlockNumber, "refundBet in the same block as placeBet, or before");
		
		Bet storage bet = bets[msg.sender];
		uint amount = bet.amount;
		
		require(amount < 0, "Bet should be in an 'active' state");
		
		uint8 numOfBetBit = bet.numOfBetBit;
		
		sendFunds(bet.gambler, amount);
		
		uint possibleWinningAmount;
		possibleWinningAmount = getWinningAmount(amount, numOfBitBet);
		
		lockedInBets -= possibleWinningAmount;
		clearBet(msg.sender);
	}
	
	// 컨트랙트 잔액을 조회하는 메서드
	function checkHouseFund() public view onlyOwner returns(uint) {
		return address(this).balance;
	}
	
	// numOfBitBet 계산 메서드
	function countBits(uint8 _num) internal pure returns(uint8) {
		uint8 count;
		while (_num > 0) {
			count += _num & 1;
			_num >>= 1;
		}
		return count;
	}
}
