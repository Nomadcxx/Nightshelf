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

const { APP_STATES, LOADING_CHROME_DELAY_MS, resolveViewState, describeViewState, shouldRenderState } = loadUtil('appStates.js')

// --- precedence ------------------------------------------------------------

test('a view with results is ready', () => {
  assert.equal(resolveViewState({ itemCount: 12 }), 'ready')
})

test('loading wins over an empty result set', () => {
  // The commonest bug this prevents: flashing "no books" for the moment
  // between opening a library and the first page arriving.
  assert.equal(resolveViewState({ isLoading: true, itemCount: 0 }), 'loading')
})

test('an error wins over loading', () => {
  assert.equal(resolveViewState({ isLoading: true, error: 'boom' }), 'error')
})

test('being offline wins over a generic error', () => {
  // Offline is actionable and error is not, so the more useful message shows.
  assert.equal(resolveViewState({ error: 'Network request failed', isOffline: true }), 'offline')
})

test('offline still yields results when there are cached items to show', () => {
  assert.equal(resolveViewState({ isOffline: true, itemCount: 4 }), 'ready')
})

test('a search with no matches is distinguished from an empty library', () => {
  assert.equal(resolveViewState({ itemCount: 0, hasQuery: true }), 'noResults')
  assert.equal(resolveViewState({ itemCount: 0, hasFilter: true }), 'noResults')
  assert.equal(resolveViewState({ itemCount: 0 }), 'empty')
})

test('loading more results keeps the view ready rather than blanking it', () => {
  assert.equal(resolveViewState({ isLoading: true, itemCount: 30, isLoadingMore: true }), 'ready')
})

test('every resolved state is one it declares', () => {
  const inputs = [{}, { isLoading: true }, { error: 'x' }, { isOffline: true }, { itemCount: 1 }, { itemCount: 0, hasQuery: true }]
  for (const input of inputs) {
    assert.ok(APP_STATES.includes(resolveViewState(input)), `${resolveViewState(input)} not declared`)
  }
})

test('a missing or malformed input resolves rather than throwing', () => {
  assert.ok(APP_STATES.includes(resolveViewState()))
  assert.ok(APP_STATES.includes(resolveViewState(null)))
  assert.ok(APP_STATES.includes(resolveViewState({ itemCount: 'many' })))
  assert.equal(resolveViewState({ itemCount: -3 }), 'empty')
})

// --- descriptions ----------------------------------------------------------

test('each state describes itself with an icon and a title key', () => {
  for (const state of APP_STATES) {
    const described = describeViewState(state)
    assert.ok(described, `no description for ${state}`)
    assert.equal(typeof described.icon, 'string')
    assert.equal(typeof described.titleKey, 'string')
    assert.ok(described.icon.length > 0)
    assert.ok(described.titleKey.length > 0)
  }
})

test('recoverable states offer a retry and unrecoverable ones do not', () => {
  assert.equal(describeViewState('error').canRetry, true)
  assert.equal(describeViewState('offline').canRetry, true)
  assert.equal(describeViewState('empty').canRetry, false)
  assert.equal(describeViewState('noResults').canRetry, false)
  assert.equal(describeViewState('ready').canRetry, false)
})

test('the ready state renders nothing', () => {
  assert.equal(describeViewState('ready').isMessage, false)
  assert.equal(describeViewState('empty').isMessage, true)
  assert.equal(describeViewState('loading').isMessage, true)
})

test('an empty library and no search matches say different things', () => {
  assert.notEqual(describeViewState('empty').titleKey, describeViewState('noResults').titleKey)
})

test('describing an unknown state falls back instead of returning undefined', () => {
  const fallback = describeViewState('not-a-state')
  assert.ok(fallback)
  assert.equal(typeof fallback.titleKey, 'string')
})

test('a context can override the message without changing the state', () => {
  const described = describeViewState('noResults', { titleKey: 'MessageNoDownloads' })
  assert.equal(described.titleKey, 'MessageNoDownloads')
  assert.equal(described.icon, describeViewState('noResults').icon, 'icon still comes from the state')
})

// --- loading chrome delay --------------------------------------------------

test('loading chrome is withheld until the delay has elapsed', () => {
  assert.equal(shouldRenderState('loading', 0), false)
  assert.equal(shouldRenderState('loading', 149), false)
  assert.equal(shouldRenderState('loading', LOADING_CHROME_DELAY_MS), true)
  assert.equal(shouldRenderState('loading', 800), true)
})

test('conclusive states are never delayed', () => {
  // An error or an empty result is an answer, not progress; holding it back
  // only makes the app feel slower than it is.
  for (const state of ['error', 'offline', 'empty', 'noResults', 'ready']) {
    assert.equal(shouldRenderState(state, 0), true, state)
  }
})

test('the delay threshold can be overridden', () => {
  assert.equal(shouldRenderState('loading', 60, 50), true)
  assert.equal(shouldRenderState('loading', 40, 50), false)
})

test('a missing or malformed elapsed time withholds rather than flashes', () => {
  assert.equal(shouldRenderState('loading'), false)
  assert.equal(shouldRenderState('loading', 'soon'), false)
  assert.equal(shouldRenderState('loading', NaN), false)
})
