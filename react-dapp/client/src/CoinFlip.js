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
            value: 0,
            checked: 0,
            houseBalance: 0,
            show: false,
            reveal: 0,
            reward: 0,
            txList: []
        }
        this.handleClickCoin = this.handleClickCoin.bind(this);
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
                                    <InputGroup style={{paddingBottom: '10px'}}>
                                        <Radio name="coinRadioGroup" checked={this.state.checked === 2} inline disabled>
                                            Heads
                                        </Radio>
                                        <Radio name="coinRadioGroup" checked={this.state.checked === 1} inline disabled>
                                            Tails
                                        </Radio>
                                    </InputGroup>
                                </form>
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
