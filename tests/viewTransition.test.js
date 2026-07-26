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

const { VIEW_TRANSITION_MS, VIEW_TRANSITION_REDUCED_MS, shouldAnimateViewChange, viewTransitionDuration } = loadUtil('viewTransition.js')

test('a real change between two view modes animates', () => {
  assert.equal(shouldAnimateViewChange({ from: 'rails', to: 'grid', motionMode: 'full' }), true)
})

test('changing to the same mode does not animate', () => {
  // Settings screens re-emit the current value; re-fading on that is a flicker
  // with no meaning behind it.
  assert.equal(shouldAnimateViewChange({ from: 'grid', to: 'grid', motionMode: 'full' }), false)
})

test('the first render does not animate', () => {
  assert.equal(shouldAnimateViewChange({ from: null, to: 'rails', motionMode: 'full' }), false)
  assert.equal(shouldAnimateViewChange({ from: undefined, to: 'rails', motionMode: 'full' }), false)
  assert.equal(shouldAnimateViewChange({ from: '', to: 'rails', motionMode: 'full' }), false)
})

test('reduced motion still transitions, because a crossfade is not spatial', () => {
  // Reduced motion removes travel, not feedback. The fade stays but shortens.
  assert.equal(shouldAnimateViewChange({ from: 'rails', to: 'grid', motionMode: 'reduced' }), true)
  assert.ok(viewTransitionDuration('reduced') < viewTransitionDuration('full'))
})

test('an empty view has nothing to crossfade', () => {
  assert.equal(shouldAnimateViewChange({ from: 'rails', to: 'grid', motionMode: 'full', itemCount: 0 }), false)
  assert.equal(shouldAnimateViewChange({ from: 'rails', to: 'grid', motionMode: 'full', itemCount: 5 }), true)
})

test('a missing item count is treated as populated rather than empty', () => {
  // Callers that do not track a count must still get the transition.
  assert.equal(shouldAnimateViewChange({ from: 'rails', to: 'grid', motionMode: 'full' }), true)
})

test('durations are finite and ordered', () => {
  assert.ok(Number.isFinite(VIEW_TRANSITION_MS))
  assert.ok(Number.isFinite(VIEW_TRANSITION_REDUCED_MS))
  assert.ok(VIEW_TRANSITION_REDUCED_MS < VIEW_TRANSITION_MS)
  assert.equal(viewTransitionDuration('full'), VIEW_TRANSITION_MS)
  assert.equal(viewTransitionDuration('reduced'), VIEW_TRANSITION_REDUCED_MS)
})

test('an unknown motion mode falls back to the full duration', () => {
  assert.equal(viewTransitionDuration('nonsense'), VIEW_TRANSITION_MS)
  assert.equal(viewTransitionDuration(), VIEW_TRANSITION_MS)
})

test('malformed input never throws', () => {
  assert.equal(shouldAnimateViewChange(), false)
  assert.equal(shouldAnimateViewChange(null), false)
  assert.equal(shouldAnimateViewChange({}), false)
})

// --- shared-element route continuity ---------------------------------------

const { supportsViewTransitions, coverTransitionName, runViewTransition } = loadUtil('viewTransition.js')

test('feature detection requires an actual startViewTransition function', () => {
  assert.equal(supportsViewTransitions({ startViewTransition: () => {} }), true)
  assert.equal(supportsViewTransitions({}), false)
  assert.equal(supportsViewTransitions({ startViewTransition: 'yes' }), false)
  assert.equal(supportsViewTransitions(null), false)
  assert.equal(supportsViewTransitions(undefined), false)
})

test('transition names are valid CSS custom idents', () => {
  // A name that is not a valid ident silently breaks the transition, so ids
  // that begin with a digit or contain punctuation must be normalised.
  const name = coverTransitionName('li_abc123')
  assert.match(name, /^[a-zA-Z][a-zA-Z0-9_-]*$/)
  assert.match(coverTransitionName('123-starts-with-digit'), /^[a-zA-Z][a-zA-Z0-9_-]*$/)
  assert.match(coverTransitionName('has spaces & punctuation!'), /^[a-zA-Z][a-zA-Z0-9_-]*$/)
})

test('the same entity always yields the same name, different entities never collide', () => {
  assert.equal(coverTransitionName('li_1'), coverTransitionName('li_1'))
  assert.notEqual(coverTransitionName('li_1'), coverTransitionName('li_2'))
})

test('a missing id yields no name rather than an invalid one', () => {
  assert.equal(coverTransitionName(''), null)
  assert.equal(coverTransitionName(null), null)
  assert.equal(coverTransitionName(undefined), null)
})

test('without support the mutation still runs and cleanup still happens', async () => {
  let applied = false
  let cleaned = false
  await runViewTransition({
    doc: {},
    apply: () => {
      applied = true
    },
    cleanup: () => {
      cleaned = true
    }
  })
  assert.equal(applied, true, 'navigation must never be blocked by a missing API')
  assert.equal(cleaned, true)
})

test('cleanup runs when the transition finishes normally', async () => {
  let cleaned = 0
  const doc = {
    startViewTransition(cb) {
      cb()
      return { finished: Promise.resolve(), ready: Promise.resolve() }
    }
  }
  await runViewTransition({ doc, apply: () => {}, cleanup: () => cleaned++ })
  assert.equal(cleaned, 1)
})

test('cleanup runs when the transition rejects', async () => {
  // A rejected transition must not leave view-transition-name stuck on an
  // element, or every later transition silently fails.
  let cleaned = 0
  const doc = {
    startViewTransition(cb) {
      cb()
      return { finished: Promise.reject(new Error('aborted')), ready: Promise.reject(new Error('aborted')) }
    }
  }
  await runViewTransition({ doc, apply: () => {}, cleanup: () => cleaned++ })
  assert.equal(cleaned, 1)
})

test('cleanup runs when startViewTransition throws outright', async () => {
  let applied = false
  let cleaned = 0
  const doc = {
    startViewTransition() {
      throw new Error('not today')
    }
  }
  await runViewTransition({
    doc,
    apply: () => {
      applied = true
    },
    cleanup: () => cleaned++
  })
  assert.equal(applied, true, 'the route change must still happen')
  assert.equal(cleaned, 1)
})

test('cleanup runs exactly once even if the transition settles twice', async () => {
  let cleaned = 0
  const settled = Promise.resolve()
  const doc = {
    startViewTransition(cb) {
      cb()
      return { finished: settled, ready: settled }
    }
  }
  await runViewTransition({ doc, apply: () => {}, cleanup: () => cleaned++ })
  await settled
  assert.equal(cleaned, 1)
})

test('a hung transition is cleaned up by the timeout', async () => {
  let cleaned = 0
  const doc = {
    startViewTransition(cb) {
      cb()
      return { finished: new Promise(() => {}), ready: new Promise(() => {}) }
    }
  }
  await runViewTransition({ doc, apply: () => {}, cleanup: () => cleaned++, timeoutMs: 20 })
  assert.equal(cleaned, 1, 'a transition that never settles must not strand the cover')
})

test('a throwing cleanup cannot break the caller', async () => {
  const doc = { startViewTransition: (cb) => (cb(), { finished: Promise.resolve(), ready: Promise.resolve() }) }
  await runViewTransition({
    doc,
    apply: () => {},
    cleanup: () => {
      throw new Error('cleanup blew up')
    }
  })
})

test('a settled transition leaves no timer holding the event loop open', async () => {
  // Regression: the timeout was previously unref'd so it would not keep a
  // process alive, which let the loop drain while this promise was still
  // pending. CI caught it as "Promise resolution is still pending but the
  // event loop has already resolved". The timer is now cleared on settle.
  const before = process.getActiveResourcesInfo ? process.getActiveResourcesInfo().filter((r) => r === 'Timeout').length : 0
  const doc = { startViewTransition: (cb) => (cb(), { finished: Promise.resolve(), ready: Promise.resolve() }) }
  await runViewTransition({ doc, apply: () => {}, cleanup: () => {}, timeoutMs: 60_000 })
  const after = process.getActiveResourcesInfo ? process.getActiveResourcesInfo().filter((r) => r === 'Timeout').length : 0
  assert.equal(after, before, 'the safety-net timer should be cleared once the transition settles')
})
