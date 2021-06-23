import React, { Component } from "react";

import "./App.css";
import logo from "./logo.svg";

class App extends Component {
  // constructor(props) {
  //   super(props);
  // }

  render() {
    return (
      <div className="App">
        <header>
          <img src={logo} className="App-logo"/>
        </header>
      </div>
    );
  }
}
export default App;
