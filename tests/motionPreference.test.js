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

const { MOTION_PREFERENCES, normalizeMotionPreference, resolveMotionMode } = loadUtil('motionPreference.js')

test('exposes exactly the three supported preferences', () => {
  assert.deepEqual(MOTION_PREFERENCES, ['SYSTEM', 'FULL', 'REDUCED'])
})

test('normalizes stored preference values', () => {
  assert.equal(normalizeMotionPreference('SYSTEM'), 'SYSTEM')
  assert.equal(normalizeMotionPreference('FULL'), 'FULL')
  assert.equal(normalizeMotionPreference('REDUCED'), 'REDUCED')
})

test('normalizes case and surrounding whitespace', () => {
  assert.equal(normalizeMotionPreference('full'), 'FULL')
  assert.equal(normalizeMotionPreference('  reduced  '), 'REDUCED')
})

test('falls back to SYSTEM for anything unrecognised', () => {
  assert.equal(normalizeMotionPreference('nope'), 'SYSTEM')
  assert.equal(normalizeMotionPreference(''), 'SYSTEM')
  assert.equal(normalizeMotionPreference(null), 'SYSTEM')
  assert.equal(normalizeMotionPreference(undefined), 'SYSTEM')
  assert.equal(normalizeMotionPreference(42), 'SYSTEM')
  assert.equal(normalizeMotionPreference({}), 'SYSTEM')
})

test('REDUCED always reduces, regardless of the operating system', () => {
  assert.equal(resolveMotionMode('REDUCED', false), 'reduced')
  assert.equal(resolveMotionMode('REDUCED', true), 'reduced')
})

test('OS reduced-motion overrides an explicit FULL preference', () => {
  assert.equal(resolveMotionMode('FULL', true), 'reduced')
  assert.equal(resolveMotionMode('FULL', false), 'full')
})

test('SYSTEM mirrors the operating system', () => {
  assert.equal(resolveMotionMode('SYSTEM', true), 'reduced')
  assert.equal(resolveMotionMode('SYSTEM', false), 'full')
})

test('an unrecognised preference resolves as SYSTEM would', () => {
  assert.equal(resolveMotionMode('garbage', true), 'reduced')
  assert.equal(resolveMotionMode('garbage', false), 'full')
})

test('a missing OS signal is treated as no reduced-motion request', () => {
  assert.equal(resolveMotionMode('SYSTEM', undefined), 'full')
  assert.equal(resolveMotionMode('FULL', null), 'full')
  // ...but an explicit REDUCED still wins with no OS signal at all.
  assert.equal(resolveMotionMode('REDUCED', undefined), 'reduced')
})
