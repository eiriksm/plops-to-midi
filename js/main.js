/* global WebSocket, document, location, AudioContext */
'use strict';
const React = require('react');
const ReactROM = require('react-dom');
const Soundfont = require('soundfont-player');

const ctx = new AudioContext();
const soundfont = new Soundfont(ctx);
const Instrument = require('./instrument')(soundfont);
const tunes = require('../tunes');
let message = {}
let ws = new WebSocket('ws://' + location.hostname + ':3001');

const tonesMap = {
  am: [
    'A', 'B', 'C', 'D', 'E', 'F', 'G'
  ],
  em: [
    'E', 'F#', 'G', 'A', 'B', 'C', 'D'
  ],
  dm: [
    'D', 'E', 'F', 'G', 'A', 'A#', 'C'
  ]
}

let currentDelta = 0;

const App = React.createClass({
  getInitialState: function() {
    // Hm. Seems hacky.
    ws.onmessage = message => {
      this.setState({
        message
      })
    }
    // See if the URL contains some state info.
    let defaultOps = {
      message,
      tones: tonesMap.am,
      tonesKey: 0,
      tune: 0,
      instruments: [{name: 'Bass'}]
    }
    if (window.location.hash) {
      try {
        var data = JSON.parse(atob(window.location.hash.substr(1)));
        Object.assign(defaultOps, data);
      }
      catch (err) {
        // Oh well, at least we tried.
        console.log(err)
      }
    }
    return defaultOps
  },
  render: function () {
    window.location.hash = btoa(JSON.stringify({
      instruments: this.state.instruments,
      tune: this.state.tune,
      tonesKey: this.state.tonesKey
    }));
    if (tunes[this.state.tune].data) {
      // Play the next tone, after the given amount of time.
      let linesToEmit = tunes[this.state.tune].data
      let emit = (line) => {
        this.setState({
          message: {
            data: line[1]
          }
        });
      }
      let line = linesToEmit[currentDelta];
      currentDelta++;
      setTimeout(emit.bind(this, line), linesToEmit[currentDelta][0] - line[0]);
    }
    let tunesOptions = tunes.map((n, i) => {
      return (
        <option value={i} key={i}>{n.name}</option>
      )
    })
    let instruments = this.state.instruments.map((n, i) => {
      return (
        <Instrument key={i} onEdit={this._onInstrumentEdit.bind(this, i)} onRemove={this._onRemove.bind(this, i)} data={n} message={this.state.message} tones={this.state.tones} instrument="church_organ" />
      )
    })
    return (
      <div>
        <select onChange={this._changedTones} defaultValue={this.state.tonesKey}>
          <option value="am">A minor</option>
          <option value="em">E minor</option>
          <option value="dm">D minor</option>
        </select>
        <select onChange={this._changedTune} defaultValue={this.state.tune}>
          {tunesOptions}
        </select>
        {instruments}
        <button onClick={this._addInstrument}>+</button>
        <button onClick={this._onStopToggle}>
        </button>
      </div>
    )
  },
  _onStopToggle: function() {
    this.setState({
      playing: !this.state.playing
    })
  },
  _onInstrumentEdit: function(delta, data) {
    Object.assign(this.state.instruments[delta], data);
    this.setState({
      intruments: this.state.instruments[delta]
    });
  },
  _onRemove: function(delta) {
    this.setState({
      instruments: this.state.instruments.filter((n, i) => { return i !== delta})
    })
  },
  _addInstrument: function() {
    this.setState({
      instruments: this.state.instruments.concat([{name: window.prompt('Enter instrument name')}])
    })
  },
  _changedTune: function(e) {
    this.setState({
      tune: e.target.value
    })
  },
  _changedTones: function(e) {
    this.setState({
      tones: tonesMap[e.target.value],
      tonesKey: e.target.value
    })
  }
})

ReactROM.render(
  <App />,
  document.getElementById('app')
)

ws.onopen = function() {
  console.log('Websocket open');
}
