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

const { statusLabel } = loadUtil('appbarStatus.js')

test('builds mono app bar status from route and theme', () => {
  assert.equal(statusLabel({ routeName: 'bookshelf', theme: 'night' }), 'HOME · NIGHT')
  assert.equal(statusLabel({ routeName: 'search', theme: 'terminal' }), 'SEARCH · TERMINAL')
  assert.equal(statusLabel({ routeName: 'settings', theme: 'black' }), 'SETTINGS · BLACK')
  assert.equal(statusLabel({ routeName: 'connect', theme: 'night' }), 'CONNECT · NIGHT')
  assert.equal(statusLabel({ routeName: 'bookshelf-library', theme: 'night' }), 'LIBRARY · NIGHT')
})
