/**
 * What a list-shaped view should show when it has nothing to show.
 *
 * Empty, offline and error are three different situations and each one calls
 * for a different message and a different offer of help. Treating them as one
 * "no content" case is why an offline shelf can currently claim the library is
 * empty. The precedence order below is the whole point of this module: it is
 * stated once and tested, rather than re-derived per page.
 */

export const APP_STATES = ['loading', 'error', 'offline', 'empty', 'noResults', 'ready']

/**
 * How long a load may run before it is worth telling the user about.
 *
 * Most loads against a warm server finish well inside this, and a spinner that
 * appears and vanishes inside 150 ms reads as a glitch rather than as progress.
 */
export const LOADING_CHROME_DELAY_MS = 150

/**
 * Whether a state should be drawn yet.
 *
 * Only `loading` is deferred. Errors and empty states are conclusions rather
 * than progress, so they appear immediately — delaying them would just make the
 * app look slower than it is.
 *
 * @param {string} state         current state
 * @param {number} msInState     how long the view has been in it
 * @param {number} [delayMs]     override for the loading threshold
 */
export function shouldRenderState(state, msInState, delayMs = LOADING_CHROME_DELAY_MS) {
  if (state !== 'loading') return true
  const elapsed = Number(msInState)
  if (!Number.isFinite(elapsed)) return false
  return elapsed >= delayMs
}

const STATE_DESCRIPTIONS = {
  loading: {
    icon: 'schedule',
    titleKey: 'MessageLoading',
    bodyKey: null,
    canRetry: false,
    isMessage: true
  },
  error: {
    icon: 'error_outline',
    titleKey: 'MessageServerCouldNotBeReached',
    bodyKey: null,
    canRetry: true,
    isMessage: true
  },
  offline: {
    icon: 'cloud_off',
    titleKey: 'MessageNoNetworkConnection',
    bodyKey: 'MessageOfflineShowingDownloads',
    canRetry: true,
    isMessage: true
  },
  empty: {
    icon: 'folder',
    titleKey: 'MessageBookshelfEmpty',
    bodyKey: null,
    canRetry: false,
    isMessage: true
  },
  noResults: {
    icon: 'search',
    titleKey: 'MessageNoResults',
    bodyKey: 'MessageNoResultsHint',
    canRetry: false,
    isMessage: true
  },
  ready: {
    icon: 'check',
    titleKey: 'MessageLoading',
    bodyKey: null,
    canRetry: false,
    isMessage: false
  }
}

function countOf(value) {
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return 0
  return num
}

/**
 * Decide which state a view is in.
 *
 * @param {object} input
 * @param {boolean} input.isLoading      a request is in flight
 * @param {boolean} input.isLoadingMore  that request is pagination, not the first page
 * @param {*}       input.error          truthy if the last request failed
 * @param {boolean} input.isOffline      the device or server is unreachable
 * @param {number}  input.itemCount      items currently renderable
 * @param {boolean} input.hasQuery       the user typed a search
 * @param {boolean} input.hasFilter      a filter is applied
 */
export function resolveViewState(input) {
  const source = input && typeof input === 'object' ? input : {}
  const itemCount = countOf(source.itemCount)

  // Anything already on screen outranks every other state. Replacing a
  // populated shelf with a spinner or an error panel loses the user's place.
  if (itemCount > 0) return 'ready'

  if (source.error) return source.isOffline ? 'offline' : 'error'
  if (source.isOffline) return 'offline'

  // Pagination must never blank the view, but with nothing rendered yet a
  // "loading more" flag is just the first load by another name.
  if (source.isLoading) return 'loading'

  if (source.hasQuery || source.hasFilter) return 'noResults'
  return 'empty'
}

/**
 * Describe a state for rendering. `overrides` lets a view supply a more
 * specific message — "no downloads yet" rather than "no results" — without
 * inventing a new state.
 */
export function describeViewState(state, overrides = {}) {
  const base = STATE_DESCRIPTIONS[state] || STATE_DESCRIPTIONS.empty
  return { ...base, ...(overrides || {}) }
}
