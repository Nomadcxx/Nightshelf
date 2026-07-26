/**
 * Pure press-gesture classification for library items.
 *
 * This module owns no DOM and no timers. The caller feeds it pointer events and
 * a clock, which is what makes every threshold and cancellation path testable.
 * `mixins/libraryPressInteraction.js` supplies the real Pointer Events and
 * timers on top of it.
 *
 * The gesture must coexist with a vertically scrolling page containing
 * horizontally scrolling rails, so it never asks the caller to preventDefault
 * before commitment, and it cancels readily.
 */

// Delay before showing any pressed state, so ordinary scrolling never flashes it.
export const PRESS_INTENT_DELAY_MS = 70
// Deliberate hold required to open Nightglass Peek.
export const PRESS_HOLD_COMMIT_MS = 420
// Travel beyond this many CSS px means the user is scrolling, not pressing.
export const PRESS_MOVE_TOLERANCE_PX = 10

const IDLE = 'idle'
const PENDING = 'pending'
const PRESSED = 'pressed'
const COMMITTED = 'committed'
const CANCELLED = 'cancelled'

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

export function pointDistance(a, b) {
  if (!a || !b) return 0
  const dx = (b.x || 0) - (a.x || 0)
  const dy = (b.y || 0) - (a.y || 0)
  return Math.sqrt(dx * dx + dy * dy)
}

export function exceedsMoveTolerance(start, current, tolerance = PRESS_MOVE_TOLERANCE_PX) {
  return pointDistance(start, current) > tolerance
}

/**
 * A one-shot guard for the synthetic click that follows a committed hold.
 * Armed on commitment, consumed by the next click, and never swallows more
 * than one — otherwise a later genuine tap would be silently dropped.
 */
export function createClickSuppressor() {
  let armed = false
  return {
    arm() {
      armed = true
    },
    disarm() {
      armed = false
    },
    get isArmed() {
      return armed
    },
    shouldSuppress() {
      if (!armed) return false
      armed = false
      return true
    }
  }
}

export function createPressGesture(options = {}) {
  const intentDelay = isFiniteNumber(options.intentDelayMs) ? options.intentDelayMs : PRESS_INTENT_DELAY_MS
  const holdCommit = isFiniteNumber(options.holdCommitMs) ? options.holdCommitMs : PRESS_HOLD_COMMIT_MS
  const moveTolerance = isFiniteNumber(options.moveTolerancePx) ? options.moveTolerancePx : PRESS_MOVE_TOLERANCE_PX

  let state = IDLE
  let pointerId = null
  let origin = null
  let startTime = 0
  let cancelReason = null
  let committed = false
  let commitHandlers = []

  function clear() {
    state = IDLE
    pointerId = null
    origin = null
    startTime = 0
    cancelReason = null
    committed = false
  }

  function cancel(reason) {
    if (state === IDLE || state === CANCELLED) {
      state = CANCELLED
      cancelReason = reason || cancelReason || 'cancelled'
      return api
    }
    state = CANCELLED
    cancelReason = reason || 'cancelled'
    return api
  }

  function advance(now) {
    if (state !== PENDING && state !== PRESSED) return api
    if (!isFiniteNumber(now)) return api
    const elapsed = now - startTime
    // A clock that runs backwards must never satisfy a threshold.
    if (elapsed < 0) return api
    if (state === PENDING && elapsed >= intentDelay) state = PRESSED
    if (elapsed >= holdCommit && !committed) {
      state = COMMITTED
      committed = true
      commitHandlers.forEach((fn) => {
        try {
          fn()
        } catch (err) {
          // A misbehaving listener must not corrupt gesture state.
          console.error('[libraryPressGesture] commit handler failed', err)
        }
      })
    }
    return api
  }

  const api = {
    get state() {
      return state
    },
    get cancelReason() {
      return cancelReason
    },
    get hasCommitted() {
      return committed
    },
    get isPressed() {
      return state === PRESSED || state === COMMITTED
    },
    get isPending() {
      return state === PENDING
    },

    onCommit(fn) {
      if (typeof fn === 'function') commitHandlers.push(fn)
      return api
    },

    start(event = {}) {
      // A second pointer during an active gesture means a pinch or a two-finger
      // scroll, never a deliberate hold.
      if (state === PENDING || state === PRESSED || state === COMMITTED) {
        if (event.pointerId !== pointerId) return cancel('second-pointer')
        return api
      }
      if (event.isPrimary === false) return api
      if (!isFiniteNumber(event.x) || !isFiniteNumber(event.y)) return api

      state = PENDING
      pointerId = event.pointerId
      origin = { x: event.x, y: event.y }
      startTime = isFiniteNumber(event.t) ? event.t : 0
      cancelReason = null
      committed = false
      return api
    },

    move(event = {}) {
      if (state !== PENDING && state !== PRESSED) return api
      if (event.pointerId !== pointerId) return api
      if (!isFiniteNumber(event.x) || !isFiniteNumber(event.y)) return api
      if (exceedsMoveTolerance(origin, { x: event.x, y: event.y }, moveTolerance)) {
        return cancel('moved')
      }
      return advance(event.t)
    },

    tick(now) {
      return advance(now)
    },

    end(event = {}) {
      if (event.pointerId !== undefined && event.pointerId !== pointerId) {
        return { state, outcome: null }
      }
      let outcome
      if (state === CANCELLED) outcome = 'cancelled'
      else if (state === COMMITTED) outcome = 'hold'
      else if (state === PENDING || state === PRESSED) outcome = 'tap'
      else outcome = null

      const finalState = state
      if (outcome) clear()
      return { state: finalState, outcome }
    },

    cancel,

    reset() {
      clear()
      return api
    },

    /** Drop commit listeners too — for component teardown. */
    destroy() {
      clear()
      commitHandlers = []
      return api
    }
  }

  return api
}
