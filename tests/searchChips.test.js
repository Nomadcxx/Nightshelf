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

const { visibleGroups } = loadUtil('searchChips.js')

test('filters search result groups by chip', () => {
  const groups = ['books', 'podcasts', 'series', 'authors']
  assert.deepEqual(visibleGroups('all', groups), groups)
  assert.deepEqual(visibleGroups('books', groups), ['books'])
  assert.deepEqual(visibleGroups('series', groups), ['series'])
})
