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

const {
  PRESS_INTENT_DELAY_MS,
  PRESS_HOLD_COMMIT_MS,
  PRESS_MOVE_TOLERANCE_PX,
  pointDistance,
  exceedsMoveTolerance,
  createPressGesture,
  createClickSuppressor
} = loadUtil('libraryPressGesture.js')

const P = { pointerId: 1, isPrimary: true, pointerType: 'touch' }

function startedAt(t = 0, extra = {}) {
  const g = createPressGesture()
  g.start({ ...P, x: 100, y: 100, t, ...extra })
  return g
}

// --- thresholds -----------------------------------------------------------

test('exposes the thresholds the specification locks down', () => {
  assert.equal(PRESS_INTENT_DELAY_MS, 70)
  assert.equal(PRESS_HOLD_COMMIT_MS, 420)
  assert.equal(PRESS_MOVE_TOLERANCE_PX, 10)
})

// --- geometry -------------------------------------------------------------

test('measures pointer travel', () => {
  assert.equal(pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5)
  assert.equal(pointDistance({ x: 10, y: 10 }, { x: 10, y: 10 }), 0)
})

test('movement tolerance is exclusive at the boundary', () => {
  const origin = { x: 0, y: 0 }
  assert.equal(exceedsMoveTolerance(origin, { x: 9, y: 0 }), false)
  assert.equal(exceedsMoveTolerance(origin, { x: 10, y: 0 }), false)
  assert.equal(exceedsMoveTolerance(origin, { x: 11, y: 0 }), true)
})

// --- state progression ----------------------------------------------------

test('begins pending and shows no pressed state before the intent delay', () => {
  const g = startedAt(0)
  assert.equal(g.state, 'pending')
  assert.equal(g.tick(69).state, 'pending')
})

test('enters pressed once the intent delay elapses', () => {
  const g = startedAt(0)
  assert.equal(g.tick(70).state, 'pressed')
})

test('commits at the hold threshold', () => {
  const g = startedAt(0)
  g.tick(70)
  assert.equal(g.tick(419).state, 'pressed')
  assert.equal(g.tick(420).state, 'committed')
})

test('commits exactly once no matter how long the hold continues', () => {
  const g = startedAt(0)
  let commits = 0
  g.onCommit(() => commits++)
  g.tick(420)
  g.tick(500)
  g.tick(900)
  assert.equal(commits, 1)
})

// --- taps vs holds --------------------------------------------------------

test('a release before the threshold is a tap', () => {
  const g = startedAt(0)
  g.tick(70)
  assert.equal(g.end({ pointerId: 1, t: 200 }).outcome, 'tap')
})

test('a release after commitment is a hold, not a tap', () => {
  const g = startedAt(0)
  g.tick(420)
  assert.equal(g.end({ pointerId: 1, t: 500 }).outcome, 'hold')
})

test('a release during the intent delay still counts as a tap', () => {
  const g = startedAt(0)
  assert.equal(g.end({ pointerId: 1, t: 40 }).outcome, 'tap')
})

// --- cancellation ---------------------------------------------------------

test('movement within tolerance does not cancel', () => {
  const g = startedAt(0)
  g.tick(70)
  g.move({ pointerId: 1, x: 108, y: 100, t: 100 })
  assert.equal(g.state, 'pressed')
  assert.equal(g.tick(420).state, 'committed')
})

test('movement beyond tolerance cancels and permits scrolling', () => {
  const g = startedAt(0)
  g.tick(70)
  g.move({ pointerId: 1, x: 130, y: 100, t: 100 })
  assert.equal(g.state, 'cancelled')
  // and cannot later commit
  assert.equal(g.tick(420).state, 'cancelled')
})

test('a cancelled gesture emits no commit and no tap', () => {
  const g = startedAt(0)
  let commits = 0
  g.onCommit(() => commits++)
  g.move({ pointerId: 1, x: 200, y: 300, t: 50 })
  g.tick(420)
  assert.equal(commits, 0)
  assert.equal(g.end({ pointerId: 1, t: 500 }).outcome, 'cancelled')
})

test('an explicit cancel records its reason', () => {
  const g = startedAt(0)
  g.cancel('pointercancel')
  assert.equal(g.state, 'cancelled')
  assert.equal(g.cancelReason, 'pointercancel')
})

test('a second pointer cancels the gesture', () => {
  const g = startedAt(0)
  g.tick(70)
  g.start({ pointerId: 2, isPrimary: false, pointerType: 'touch', x: 200, y: 200, t: 80 })
  assert.equal(g.state, 'cancelled')
  assert.equal(g.cancelReason, 'second-pointer')
})

test('events from a different pointer are ignored, not acted on', () => {
  const g = startedAt(0)
  g.tick(70)
  g.move({ pointerId: 99, x: 400, y: 400, t: 100 })
  assert.equal(g.state, 'pressed')
  assert.equal(g.end({ pointerId: 99, t: 120 }).outcome, null)
  assert.equal(g.state, 'pressed')
})

test('a non-primary pointer never starts a gesture', () => {
  const g = createPressGesture()
  g.start({ pointerId: 3, isPrimary: false, pointerType: 'touch', x: 10, y: 10, t: 0 })
  assert.equal(g.state, 'idle')
})

// --- cleanup --------------------------------------------------------------

test('reset returns the gesture to idle and clears bookkeeping', () => {
  const g = startedAt(0)
  g.tick(420)
  g.reset()
  assert.equal(g.state, 'idle')
  assert.equal(g.cancelReason, null)
  assert.equal(g.isPressed, false)
  assert.equal(g.hasCommitted, false)
})

test('a gesture reused after reset behaves like a fresh one', () => {
  const g = startedAt(0)
  g.tick(420)
  g.reset()
  g.start({ ...P, x: 0, y: 0, t: 1000 })
  assert.equal(g.state, 'pending')
  assert.equal(g.tick(1070).state, 'pressed')
  assert.equal(g.tick(1420).state, 'committed')
})

// --- malformed input ------------------------------------------------------

test('malformed coordinates fail safe rather than committing', () => {
  const g = createPressGesture()
  g.start({ ...P, x: NaN, y: undefined, t: 0 })
  assert.equal(g.state, 'idle')
})

test('a backwards clock cannot force a commit', () => {
  const g = startedAt(1000)
  assert.equal(g.tick(500).state, 'pending')
  assert.equal(g.hasCommitted, false)
})

test('a missing timestamp does not throw', () => {
  const g = createPressGesture()
  assert.doesNotThrow(() => g.start({ ...P, x: 1, y: 1 }))
  assert.doesNotThrow(() => g.tick())
})

// --- click suppression ----------------------------------------------------

test('the click following a committed hold is suppressed exactly once', () => {
  const s = createClickSuppressor()
  s.arm()
  assert.equal(s.shouldSuppress(), true)
  assert.equal(s.shouldSuppress(), false)
})

test('an unarmed suppressor never swallows a click', () => {
  const s = createClickSuppressor()
  assert.equal(s.shouldSuppress(), false)
})

test('disarming clears a pending suppression', () => {
  const s = createClickSuppressor()
  s.arm()
  s.disarm()
  assert.equal(s.shouldSuppress(), false)
})
