/**
 * When switching library view modes is worth a crossfade.
 *
 * Changing view mode rebuilds every card, which without help reads as a flash.
 * The fix is one fade over the whole container — never a transition group over
 * hundreds of cards, which is both slow and visually chaotic.
 *
 * The cases below all produce a fade with nothing to show for it, so each is
 * refused rather than left to the component to remember.
 */

export const VIEW_TRANSITION_MS = 220
export const VIEW_TRANSITION_REDUCED_MS = 120

/**
 * @param {object} change
 * @param {string} change.from        previous view mode, null on first render
 * @param {string} change.to          incoming view mode
 * @param {string} change.motionMode  'full' or 'reduced'
 * @param {number} [change.itemCount] items on screen; omit if not tracked
 */
export function shouldAnimateViewChange(change) {
  if (!change || typeof change !== 'object') return false

  const { from, to } = change
  // First render: there is no previous state to fade away from.
  if (!from || !to) return false
  if (from === to) return false

  // An empty container has nothing to crossfade, and fading a state message in
  // and out again just makes the message harder to read.
  if (typeof change.itemCount === 'number' && change.itemCount <= 0) return false

  // Reduced motion keeps this one. A crossfade carries no spatial travel, and
  // removing it would leave an abrupt swap with no indication anything changed.
  return true
}

export function viewTransitionDuration(motionMode) {
  return motionMode === 'reduced' ? VIEW_TRANSITION_REDUCED_MS : VIEW_TRANSITION_MS
}

/* -------------------------------------------------------------------------- */
/* Shared-cover route continuity                                              */
/* -------------------------------------------------------------------------- */

/** Longest a transition may run before we clean up regardless. */
export const VIEW_TRANSITION_TIMEOUT_MS = 1000

/**
 * Whether this WebView can do shared-element view transitions at all.
 * Older Android WebViews cannot, and must keep ordinary routing.
 */
export function supportsViewTransitions(doc) {
  return !!doc && typeof doc.startViewTransition === 'function'
}

/**
 * A `view-transition-name` for an entity's cover.
 *
 * The value must be a CSS custom-ident: it cannot start with a digit and cannot
 * contain punctuation. An invalid name does not throw — the transition just
 * silently does nothing — so ids are normalised rather than trusted.
 *
 * The name is derived from the id so the shelf cover and the detail cover agree
 * without having to coordinate. Only the *activated* card is ever given a name,
 * which is what stops the same book appearing in two rails from colliding.
 */
export function coverTransitionName(entityId) {
  if (typeof entityId !== 'string' || !entityId.trim()) return null
  const safe = entityId.trim().replace(/[^a-zA-Z0-9_-]/g, '-')
  return `nscover-${safe}`
}

/**
 * Run a route mutation inside a view transition, guaranteeing cleanup.
 *
 * The failure this is built around: a `view-transition-name` left on an element
 * after a cancelled or rejected transition poisons every later transition, and
 * a half-applied transition can leave the cover invisible. So `cleanup` runs on
 * success, rejection, throw, and timeout — exactly once — and `apply` runs no
 * matter what, because navigation must never depend on an animation.
 *
 * @param {object}   opts
 * @param {object}   opts.doc        document (injected for testing)
 * @param {Function} opts.apply      the actual route mutation
 * @param {Function} [opts.cleanup]  removes temporary names/styles
 * @param {number}   [opts.timeoutMs]
 */
export function runViewTransition({ doc, apply, cleanup, timeoutMs = VIEW_TRANSITION_TIMEOUT_MS } = {}) {
  let cleanedUp = false
  const runCleanup = () => {
    if (cleanedUp) return
    cleanedUp = true
    try {
      if (typeof cleanup === 'function') cleanup()
    } catch (error) {
      // Cleanup is best-effort; it must never propagate into navigation.
      console.error('view transition cleanup failed', error)
    }
  }

  const runApply = () => {
    if (typeof apply === 'function') apply()
  }

  if (!supportsViewTransitions(doc)) {
    runApply()
    runCleanup()
    return Promise.resolve()
  }

  let transition
  try {
    transition = doc.startViewTransition(runApply)
  } catch (error) {
    // The API exists but refused. The route change still has to happen.
    console.error('startViewTransition failed', error)
    runApply()
    runCleanup()
    return Promise.resolve()
  }

  // `ready` rejects whenever the browser skips the transition. Nothing here
  // awaits it, so without an explicit handler that rejection surfaces as an
  // unhandled promise rejection in the WebView.
  if (transition && transition.ready && typeof transition.ready.catch === 'function') {
    transition.ready.catch(() => {})
  }

  const settled = Promise.resolve(transition && transition.finished).catch(() => {})
  const timer = new Promise((resolve) => {
    const handle = setTimeout(resolve, timeoutMs)
    // Don't hold a Node process (or test run) open waiting on the safety net.
    if (handle && typeof handle.unref === 'function') handle.unref()
  })

  return Promise.race([settled, timer]).then(runCleanup, runCleanup)
}
