// 솔리디티 버전
pragma solidity ^0.4.24;

// 컨트랙트 생성 (클래스와 비슷한 느낌)
contract HelloWorld {

	// 변수 선언(문자열: stirng 정수: uint(양수), int 주소: adress ))
	// public 은 외부에서 호출 가능
    string public greeting;
    
	// 생성자
    constructor(string _greeting) public {
        greeting = _greeting;
    }
    
	// greeting 값을 지정해주는 메서드
    function setGreeting(string _greeting) public {
        greeting = _greeting;
    }
    
	// greeting 값 리턴해주는 메서드
    function say() public constant returns(string) {
        return greeting;
    }
}