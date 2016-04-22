'use strict';
const React = require('react');
const instruments = require('./instruments');

const LOADED_INSTRUMENT = 1;
const LOADING_INSTRUMENT = 2;

let sf;

function messageToTone(tones, data, offset) {
  var num = parseInt(data * 1000, 10)
  return tones[num % tones.length] + '' + offset
}

let readyInstruments = {};

function play(data, state, instrument) {
  if (!data) {
    return;
  }
  let tone = messageToTone(state.tones, data, state.offset);
  setTimeout(() => {
    let source = instrument.play(tone, 0);
    source.loop = true;
    setTimeout(function() {
      source.stop();
    }, data * (state.stop * 100000));
  }, (state.delay * 1000))
}

const Instrument = React.createClass({
  getInitialState: function() {
    return {
      currentInstrument: this.props.instrument,
      offset: this.props.offset ? this.props.offset : '1',
      stop: 2,
      delay: this.props.delay ? this.props.delay : 0
    }
  },
  render: function() {
    let data = this.props.message.data;
    let name = this.state.currentInstrument;
    // Pretend to hold tones in state.
    this.state.tones = this.props.tones;
    if (name) {
      let instrument = sf.instrument(name);
      if (readyInstruments[name] === LOADED_INSTRUMENT) {
        play(data, this.state, instrument)
      }
      else {
        if (readyInstruments[name] !== LOADING_INSTRUMENT) {
          readyInstruments[name] = LOADING_INSTRUMENT;
          instrument.onready(() => {
            play(data, this.state, instrument)
            readyInstruments[name] = LOADED_INSTRUMENT;
          })
        }
      }
    }

    let instrumentsOptions = instruments.map(name => {
      return (<option key={name} value={name}>{name}</option>)
    })
    return (
      <div>
        <h2>{this.props.name}</h2>
        <select onChange={this._onInstrumentChange} defaultValue={this.state.currentInstrument}>
          {instrumentsOptions}
        </select>
        <input type="number" onChange={this._changedOffset} value={this.state.offset} />
        <input type="number" onChange={this._changedDelay} value={this.state.delay} />
        <input type="number" onChange={this._changedStop} value={this.state.stop} />
      </div>
    )
  },
  _changedStop: function(e) {
    this.setState({
      stop: parseInt(e.target.value, 10) ? parseInt(e.target.value, 10) : 0
    })
  },
  _changedDelay: function(e) {
    this.setState({
      delay: parseInt(e.target.value, 10) ? parseInt(e.target.value, 10) : 0
    })
  },
  _changedOffset: function(e) {
    this.setState({
      offset: '' + e.target.value
    })
  },
  _onInstrumentChange: function(e) {
    this.setState({
      currentInstrument: e.target.value
    });
  }
})

module.exports = function(soundfont) {
  sf = soundfont;
  return Instrument;
};
