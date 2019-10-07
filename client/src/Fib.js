import React, { Component } from "react";
import axios from "axios";

import isEmpty from "./isEmpty";

class Fib extends Component {
  state = {
    seenIndexes: [],
    values: {},
    index: ""
  };

  async componentDidMount() {
    await this.fetchValues();
    await this.fetchIndexes();
  }


 

  handleSubmit = async event => {
    event.preventDefault();

    await axios
      .post("/api/values", {
        index: this.state.index
      })
      .catch(err => {
        alert("Didn't work");
        console.error(err);
      });

    this.setState({ index: "" });
  };

  // PG
  renderSeenIndexes() {
    const { seenIndexes } = this.state;
    if (!isEmpty(seenIndexes)) {
      return this.state.seenIndexes.map(({ number }) => number).join(", ");
    }
    return null;
  }

   // PG
   async fetchIndexes() {
    try {
      const seenIndexes = await axios.get("/api/values/all");
      this.setState(
        {
          seenIndexes: seenIndexes.data
        },
        () => {
          console.log("fetchIndexes: seenIndexes", seenIndexes.data);
        }
      );
    } catch (err) {
      console.log("Couldn't fetch values");
    }
  }

  // REDIS
  renderValues() {
    const entries = [];

    for (let key in this.state.values) {
      entries.push(
        <div key={key}>
          For index {key} I calculated {this.state.values[key]}
        </div>
      );
    }
    return entries;
  }


  // REDIS
  async fetchValues() {
    try {
      const values = await axios.get("/api/values/current");
      this.setState({ values: values.data }, () => {
        console.log("fetchValues: values", values.data);
      });
    } catch (err) {
      console.log("Couldn't fetch values");
    }
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>Enter your index:</label>
          <input
            value={this.state.index}
            onChange={event => this.setState({ index: event.target.value })}
          />
          <button>Submit</button>
        </form>
        {/* PG */}
        <h3>Indexes I have seen:</h3>
        {this.renderSeenIndexes()}

        {/* REDIS */}
        <h3>Calculated Values:</h3>
        {this.renderValues()}
      </div>
    );
  }
}

export default Fib;
