import React, {Component} from "react";
import {Grid, Row, Col, Panel, Image, Glyphicon} from "react-bootstrap";
import {Button, ButtonGroup, ButtonToolbar} from "react-bootstrap";
import {InputGroup, FormControl, Radio, ListGroup, ListGroupItem} from "react-bootstrap";
import "./css/bootstrap.min.css";
import "./css/style.css";
import getWeb3 from './getWeb3';
import truffleContract from "truffle-contract";
import CoinToFlip from './contracts/CoinToFlip.json';


class CoinFlip extends Component {
    
    constructor(props) {
        super(props);
        this.state = {
            web3: null,
            accounts: null,
            contract: null,
            value: 0,        // 베팅 금액
            checked: 0,      // 선택한 동전 면
            houseBalance: 0, // 하우스가 가지고 있는 금액
            show: {flag: false, msg: ""},     // 경고 메시지 출력용
            reveal: 0,       // 동전의 앞 또는 뒤
            reward: 0,       // 보상
            txList: [],
            balance: 0,
            contractAddress: null,
        }
    }

    componentDidMount = async () => {
        try{
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();

            const Contract = truffleContract(CoinToFlip);
            Contract.setProvider(web3.currentProvider);
            const instance = await Contract.deployed();
            
            // 컨트랙트에서 발생하는 이벤트를 watch를 통해 계속 확인
            await instance.Reveal().watch((error, result) => this.watchEvent(error, result));
            await instance.Payment().watch((error, result) => this.watchPaymentEvent(error, result));
			await instance.CheckHouseFund().watch((error, result) => this.watchHouseFundEvent(error, result));
			
            this.setState({web3, accounts, contract: instance});
            await web3.eth.getBalance(String(accounts[0])).then((balance) => {
                this.setState({balance: balance * 0.000000000000000001});
            });
            await instance.getHouseFund().then((balance) => {
                this.setState({houseBalance: balance * 0.000000000000000001})
            })
            this.setState({contractAddress: instance.address});
        } catch (error) {
            alert("Failed to load web3, accounts, or contract. Check console for details.");
            console.log(error);
        }
    }

    handleClickCoin = (e) => {
        if(this.state.checked === 0) {
            if (e.target.id === "Heads") {
                this.setState({checked: 2});
            } else if (e.target.id === "Tails") {
                this.setState({checked: 1});
            }
        } else {
            this.setState({checked: 0});
        }
    };

    handleClickBet = async () => {
        const {web3, accounts, contract} = this.state;

        if(!this.state.web3) {
            console.log("App is not ready");
            return;
        }

        if(accounts[0] === undefined) {
            alert("Please press F5 to connect Dapp");
            return;
        }
		try {
			if(this.state.value <= 0 || this.state.checked === 0) {
            	this.setState({show: {flag: true, msg: "You should bet bigger than 0.01 ETH"}});
        	} else {
            	await contract.placeBet(this.state.checked, {from: accounts[0], value: web3.utils.toWei(String(this.state.value), "ether")});
            	this.setState({show: {flag: false, msg: ""}, reveal: 0, reward: 0});
				alert("베팅이 완료되었습니다. 이제 동전을 던져주세요!")
        	}	
		} catch (error) {
			console.log(error.message);
		}
    };

    handleClickFlip = async () => {
        const {accounts, contract} = this.state;

        if(!this.state.web3) {
            console.log("App is not ready");
            return;
        }

        if(accounts[0] === undefined) {
            alert("Please press F5 to connect Dapp");
            return;
        }

        let seed = Math.floor((Math.random() * 255) + 1);
		try {
			await contract.revealResult(seed, {from:accounts[0]});
			alert("동전을 던졌습니다. 결과를 확인해주세요.");
		} catch (error) {
			console.log(error.message);
		}
    };

    handleValChange = (e) => {
        this.setState({value: e.target.value});
    }

    handleClickReset = () => {
        this.setState({reveal: 0, value: 0, checked: 0, reward: 0});
		alert("다시 시작합니다");
    };

    watchEvent = (error, result) => {
        if(!error) {
            const {web3} = this.state;
            this.setState({reveal: web3.utils.toDecimal(result.args.reveal)});
        } else {
            console.log(error);
        }
    };

    watchPaymentEvent = (error, result) => {
        if(!error) {
            const {web3} = this.state;
            let r = web3.utils.fromWei(web3.utils.toBN(result.args.amount).toString(), 'ether');
            if(r > 0) {
                this.setState({reward: r});
				alert("성공! 보상금을 확인하세요");
            }
        }
    };

	watchHouseFund = (error, result) => {
		if(!error) {
			const {web3} = this.state;
			this.setState({houseBalance: result.args.balance});
		} else {
			console.log(error);
		}
	}

    // resetTxList = () => {
    //     this.setState({txList: []}, this.getRecepiptList);
    // };

    // getRecepiptList = async () => {
    //     const {web3, accounts, contract} = this.state;
    //     const lowerLimit = 50;

    //     let result = [];

    //     let blockNumber = await web3.eth.getBlockNumber();
    //     console.log("Block Number" + blockNumber);

    //     let upperBlockNumber = blockNumber;
    //     let lowerBlockNumber = (parseInt(upperBlockNumber, 10)-lowerLimit < 0) ? 0 : upperBlockNumber-lowerLimit;
        
    //     for(let i=upperBlockNumber; i>lowerBlockNumber; i--) {
    //         let block = await web3.eth.getBlock(i, false);
    //         if(block.transactions.length > 0) {
    //             block.transactions.forEach(async function(txHash) {
    //                 let tx = await web3.eth.getTransaction(txHash.toString());
    //                 if(tx != null && tx.from === accounts[0] && tx.to.toLowerCase() === contract.address.toLowerCase()) {
    //                     await web3.eth.getTransactionReceipt(tx.hash, function(e, r) {
    //                         if(r.logs.length === 2) {
    //                             result.push({"txhash": r.transactionHash,
    //                                 "value": web3.utils.fromWei(web3.utils.toBN(r.logs[1].data).toStirng(), "ether")});
    //                         } else if(r.logs.length === 1) {
    //                             result.push({"txhash": r.transactionHash, "value": 0});
    //                         }
    //                     })
    //                 }
    //             })
    //         }
    //     }
    //     this.setState({txList: result.splice(0, 5)});
    // };

    render() {
        let coin_h = "/images/coin-h.png";
        let coin_t = "/images/coin-t.png";

        let coin = 
            <div className="coin-box">
                <Image src={coin_h} id="Heads" onClick={this.handleClickCoin} className="img-coin"/>
                <Image src={coin_t} id="Tails" onClick={this.handleClickCoin} className="img-coin"/>
            </div>

        return (
            <Grid fluid={true}>
                <Row className="show-grid">
                    <Col md={5}>
                        <Panel bsStyle="info">
                            <Panel.Heading>
                                <Panel.Title>
                                    <Glyphicon glyph="thumbs-up"/> House: {this.state.houseBalance} ETH <br/> Adress: {this.state.contractAddress}
                                </Panel.Title>
                            </Panel.Heading>
                            <Panel.Body className="custom-align-center">
                                {coin}
                            </Panel.Body>
                        </Panel>
                    </Col>
                    <Col md={5}>
                        <Reveal reveal={this.state.reveal} reward={this.state.reward} />
                    </Col>
                </Row>
                <Row className="show-grid">
                    <Col md={5}>
                        <Panel bsStyle="info">
                            <Panel.Heading>
                                <Panel.Title>
                                    <Glyphicon glyph="ok-circle" /> 베팅하기
                                </Panel.Title>
                            </Panel.Heading>
                            <Panel.Body className="custom-align-center">
                                <form>
                                    지갑 주소 : {this.state.accounts} <br/>
                                    잔액 : {this.state.balance} ETH <br/>
									{this.state.show.msg}
                                    <InputGroup style={{paddingBottom: '10px'}}>
                                        <Radio name="coinRadioGroup" checked={this.state.checked === 2} inline disabled>
                                            Heads
                                        </Radio>
                                        <Radio name="coinRadioGroup" checked={this.state.checked === 1} inline disabled>
                                            Tails
                                        </Radio>
                                    </InputGroup>
                                </form>
                                <form>
                                    <InputGroup>
                                        <FormControl type="number" placeholder="베팅할 금액을 입력해주세요." bsSize="lg" onChange={e => this.handleValChange(e)}/>
                                    </InputGroup>
                                </form>
                                <ButtonToolbar>
                                    <ButtonGroup justified>
                                        <Button href="#" bsStyle="primary" bsSize="large" onClick={this.handleClickBet}>
                                            Bet
                                        </Button>
                                        <Button href="#" bsStyle="success" bsSize="large" onClick={this.handleClickFlip}>
                                            Flip!
                                        </Button>
                                        <Button href="#" bsSize="large">
                                            Cancel
                                        </Button>
                                        <Button href="#" bsStyle="info" bsSize="large" onClick={this.handleClickReset}>
                                            Reset
                                        </Button>
                                    </ButtonGroup>
                                </ButtonToolbar>
                            </Panel.Body>
                        </Panel>
                    </Col>
                    <Col md={5}>
                        <TxList result={this.state.txList}/>
                    </Col>
                </Row>
            </Grid>
        )
    }
}

function Reveal(props) {
    let coinImg = "/images/coin-unknown.png";
    if(props.reveal === 2) {
        coinImg = "/images/coin-h.png";
    } else if(props.reveal === 1) {
        coinImg = "/images/coin-t.png";
    }

    let coin = <Image src={coinImg} className="img-coin"/>

    return (
        <Panel bsStyle="info">
            <Panel.Heading>
                <Panel.Title>
                    <Glyphicon glyph="adjust" /> 동전 결과
                </Panel.Title>
            </Panel.Heading>
            <Panel.Body className="custom-align-center">
                {coin}
                {props.reward} ETH
            </Panel.Body>
        </Panel>
    );
}

function TxList(props) {
    // let result = props.result;
    // let txList = result.map(
    //     e => (<ListGroupItem key={e.txhash} bsStyle={e.value>0?"success":"danger"}>{e.txhash} (<b>{e.value}</b> ETH)</ListGroupItem>)
    // );

    return(
        <ListGroup>
            {this.state.txList}
        </ListGroup>
    );
}

export default CoinFlip;
