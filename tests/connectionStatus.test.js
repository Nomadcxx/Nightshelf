const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { transformSync } = require('@babel/core')

function loadUtil(filename) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'utils', filename), 'utf8')
  const { code } = transformSync(source, {
    filename,
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(require, module, module.exports)
  return module.exports
}

const { toneFromState } = loadUtil('connectionStatus.js')

test('maps connection state to status tones', () => {
  assert.equal(toneFromState({ attempting: true, networkConnected: true, socketConnected: false }), 'syncing')
  assert.equal(toneFromState({ attempting: false, networkConnected: false, socketConnected: false }), 'offline')
  assert.equal(toneFromState({ attempting: false, networkConnected: true, socketConnected: false }), 'degraded')
  assert.equal(toneFromState({ attempting: false, networkConnected: true, socketConnected: true }), 'online')
})
