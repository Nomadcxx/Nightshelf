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

const { normalizeViewMode, toggleViewMode } = loadUtil('libraryViewMode.js')

test('normalizes and toggles library view mode', () => {
  assert.equal(normalizeViewMode('rails'), 'rails')
  assert.equal(normalizeViewMode('grid'), 'grid')
  assert.equal(normalizeViewMode('compact'), 'compact')
  assert.equal(normalizeViewMode('nope'), 'rails')
  assert.equal(toggleViewMode('rails'), 'grid')
  assert.equal(toggleViewMode('grid'), 'compact')
  assert.equal(toggleViewMode('compact'), 'rails')
})
