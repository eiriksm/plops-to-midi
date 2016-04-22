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
    return {
      message,
      tones: tonesMap.am,
      tune: 0
    }
  },
  render: function () {
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
    return (
      <div>
        <select onChange={this._changedTones} defaultValue="am">
          <option value="am">A minor</option>
          <option value="em">E minor</option>
          <option value="dm">D minor</option>
        </select>
        <select onChange={this._changedTune} defaultValue="am">
          {tunesOptions}
        </select>
        <Instrument name="Bass" message={this.state.message} tones={this.state.tones} instrument="fx_6_goblins" />
        <Instrument name="Lead" message={this.state.message} tones={this.state.tones} instrument="church_organ" delay="2" offset="4"/>
      </div>
    )
  },
  _changedTune: function(e) {
    this.setState({
      tune: e.target.value
    })
  },
  _changedTones: function(e) {
    this.setState({
      tones: tonesMap[e.target.value]
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
