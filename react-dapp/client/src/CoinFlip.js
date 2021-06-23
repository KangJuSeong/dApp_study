import React, {Component} from "react";
import {Text} from "react";
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
            show: false,     // 경고 메시지 출력용
            reveal: 0,       // 동전의 앞 또는 뒤
            reward: 0,       // 보상
            txList: [],
            balance: 0,
        }
        this.handleClickCoin = this.handleClickCoin.bind(this);
        this.handleClickBet = this.handleClickBet.bind(this);
        this.handleClickFlip = this.handleClickFlip.bind(this);
        this.handleClickReset = this.handleClickReset.bind(this);
    }

    componentDidMount = async () => {
        try{
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();

            const Contract = truffleContract(CoinToFlip);
            Contract.setProvider(web3.currentProvider);
            const instance = await Contract.deployed();

            await instance.Reveal().watch((error, result) => this.watchEvent(error, result));
            await instance.Payment().watch((error, result) => this.watchPaymentEvent(error, result));
            this.setState({web3, accounts, contract: instance});
            await web3.eth.getBalance(String(accounts)).then((balance) => {
                this.setState({balance: balance * 0.000000000000000001});
            });
        } catch (error) {
            alert("Failed to load web3, accounts, or contract. Check console for details.");
            console.log(error);
        }
    }

    handleClickCoin(e) {
        if(this.state.checked === 0) {
            if (e.target.id === "Heads") {
                this.setState({checked: 2});
            } else if (e.target.id === "Tails") {
                this.setState({checked: 1});
            }
        } else {
            this.setState({checked: 0});
        }
    }

    async handleClickBet() {
        const {web3, accounts, contract} = this.state;

        if(!this.state.web3) {
            console.log("App is not ready");
            return;
        }

        if(accounts === undefined) {
            alert("Please press F5 to connect Dapp");
            return;
        }

        if(this.state.value <= 0 || this.state.checked === 0) {
            this.setState({show: true});
        } else {
            await contract.placeBet(this.state.checked, {from: accounts, value: web3.utils.toWei(String(this.state.value), "ether")});
            this.setState({show: false, reveal: 0, reward: 0});
        }
    }

    async handleClickFlip() {
        const {accounts, contract} = this.state;

        if(!this.state.web3) {
            console.log("App is not ready");
            return;
        }

        if(accounts === undefined) {
            alert("Please press F5 to connect Dapp");
            return;
        }

        let seed = Math.floor((Math.random() * 255) + 1);
        await contract.revealResult(seed, {from:accounts});
    }

    handleClickReset() {
        return;
    }

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
                                    <Glyphicon glyph="thumbs-up"/> House: 0 ETH
                                </Panel.Title>
                            </Panel.Heading>
                            <Panel.Body className="custom-align-center">
                                {coin}
                            </Panel.Body>
                        </Panel>
                    </Col>
                    <Col md={5}>
                        2
                    </Col>
                </Row>
                <Row className="show-grid">
                    <Col md={5}>
                        <Panel bsStyle="info">
                            <Panel.Heading>
                                <Panel.Title>
                                    <Glyphicon glyph="ok-circle" /> Your Bet!
                                </Panel.Title>
                            </Panel.Heading>
                            <Panel.Body className="custom-align-center">
                                <form>
                                    지갑 주소 : {this.state.accounts} <br/>
                                    잔액 : {this.state.balance} ETH
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
                                        <FormControl type="number" placeholder="베팅할 금액을 입력해주세요." bsSize="lg" onChange={this.handleValChange}/>
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
                                        <Button href="#" bsSize="large" onClick={this.handleClickReFund}>
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
                        4
                    </Col>
                </Row>
            </Grid>
        )
    }
}

export default CoinFlip;
