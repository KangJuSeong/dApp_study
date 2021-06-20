pragma solidity ^0.4.24;

// < 설계 >
// 1. 후보자
// 2. 후보자 선정
// 3. 투표
// 4. 투표 끝내기

contract Voting {
	// 구조체
	struct candidator {
		string name;
		uint votes; // 양수만 가능(uint)
	}
	
	// 변수
	candidator[] public candidatorList; // 구 조체 배열
	bool live;  // 투표 진행 여부
	address owner;  // 투표 개설자
	
	// 매핑
	mapping(address => bool) Voted;  // 투표한 사람에 대한 매핑
	
	// 확장자 (권한자)
	modifier onlyOwner {
		require(msg.sender == owner);
		_;  // 위 조건이 만족하면 아래 코드들을 실행
	}
	
	// 이벤트
	event AddCandidator(string name);  // 후보자 이름을 받아 누가 추가되었는지 확인
	event UpVotes(string candidator, uint votes); // 어떤 후보자가 몇표 받았는지 확인
	event FinishVote(bool live);  // 투표가 끝남을 확인
	event StartVote(address owner); // 투표가 시작을 확인
	
	// 생성자(최초 컨트랙트 발생시 동작)
	constructor() public {
		owner = msg.sender;
		live = true;
		
		emit StartVote(owner);
	}
	
	// 후보자 추가 (언더바는 매개변수 관례)
	function addCandidator(string _name) public onlyOwner { 
	
		// require 조건에 충족해야만 계속 실행 -> 가스를 절약 할 수 있음
		require(live == true);
		require(candidatorList.length < 5);  // 후보자 수가 5명이보다 적을 때 추가 가능
		
		candidatorList.push(candidator(_name, 0));  // 후보자 리스트에 후보자 구조체 추가
		
		// 이벤트로 외부에 알리기
		emit AddCandidator(_name);
	}
	
	// 후보자 투표
	function Votes(uint _candidatorIndex) public {
		require(live == true);
		require(Voted[msg.sender] == false);  // 투표자(msg.sender)가 투표를 하지 않은 상태이어야 함
		require(_candidatorIndex < candidatorList.length);  // 존재하지 않는 후보자의 인덱스를 입력하는 경우 제거
		
		candidatorList[_candidatorIndex].votes ++;  // 투표수 증가
		
		Voted[msg.sender] = true;  // 현재 투표자(msg.sender)가 투표를 했으므로 해당 값을 true
		
		emit UpVotes(candidatorList[_candidatorIndex].name, candidatorList[_candidatorIndex].votes);
	}
	
	// 투표 종료 (투표 종료는 해당 컨트랙트를 만든 사람만 할 수 있도록 하기)
	function finishVote() public onlyOwner {
		require(live == true);  // 투표가 진행 되어야지만 종료 가능
		live = false;
		
		emit FinishVote(live);
	}
}