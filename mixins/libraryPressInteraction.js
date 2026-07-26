import { createPressGesture, createClickSuppressor, PRESS_INTENT_DELAY_MS, PRESS_HOLD_COMMIT_MS } from '@/utils/libraryPressGesture'

/**
 * Wires the pure press-gesture state machine to real Pointer Events.
 *
 * Scroll safety is the whole point of this file. Library rails scroll
 * horizontally inside a vertically scrolling page, so the handlers never call
 * preventDefault before the hold commits, and the gesture cancels on the first
 * sign the user is scrolling instead of pressing.
 *
 * Consumers get `isPressPending` / `isPressed` for styling and a
 * `press-commit` event when a hold completes. They are responsible for
 * rendering, not for event plumbing.
 */
export default {
  data() {
    return {
      isPressPending: false,
      isPressed: false
    }
  },
  created() {
    // Non-reactive: these change on every pointer event and must not re-render.
    this._pressGesture = null
    this._pressIntentTimer = null
    this._pressCommitTimer = null
    this._pressClickSuppressor = createClickSuppressor()
    this._pressCapturedEl = null
    this._pressCapturedPointerId = null
  },
  beforeDestroy() {
    // Virtualised cards are recycled aggressively; a leaked timer here would
    // commit a hold against an item the user is no longer touching.
    this.cancelPress('unmount')
    this._pressClickSuppressor = null
  },
  methods: {
    _pressNow() {
      return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
    },
    _clearPressTimers() {
      if (this._pressIntentTimer) {
        clearTimeout(this._pressIntentTimer)
        this._pressIntentTimer = null
      }
      if (this._pressCommitTimer) {
        clearTimeout(this._pressCommitTimer)
        this._pressCommitTimer = null
      }
    },
    _releasePressCapture() {
      const el = this._pressCapturedEl
      const id = this._pressCapturedPointerId
      this._pressCapturedEl = null
      this._pressCapturedPointerId = null
      if (!el || id == null) return
      try {
        if (el.hasPointerCapture && el.hasPointerCapture(id)) {
          el.releasePointerCapture(id)
        }
      } catch (error) {
        // Capture can already be gone if the element was detached.
      }
    },
    _syncPressState() {
      const gesture = this._pressGesture
      this.isPressPending = !!gesture && gesture.isPending
      this.isPressed = !!gesture && gesture.isPressed
    },

    onPressPointerDown(event) {
      // Only a primary pointer starts a gesture. Secondary buttons and
      // multi-touch are handled as cancellations below.
      if (event.button !== undefined && event.button !== 0) return
      if (this._pressGesture && this._pressGesture.state !== 'idle') {
        // A second finger means pinch or two-finger scroll, never a hold.
        this._pressGesture.cancel('second-pointer')
        this.cancelPress('second-pointer')
        return
      }

      const gesture = createPressGesture()
      this._pressGesture = gesture
      gesture.onCommit(() => this._onPressCommitted())
      gesture.start({
        pointerId: event.pointerId,
        isPrimary: event.isPrimary !== false,
        pointerType: event.pointerType,
        x: event.clientX,
        y: event.clientY,
        t: this._pressNow()
      })

      if (gesture.state !== 'pending') {
        this._pressGesture = null
        return
      }

      // Capture makes cleanup reliable when the pointer leaves the element,
      // and does not by itself block scrolling.
      try {
        if (event.currentTarget && event.currentTarget.setPointerCapture) {
          event.currentTarget.setPointerCapture(event.pointerId)
          this._pressCapturedEl = event.currentTarget
          this._pressCapturedPointerId = event.pointerId
        }
      } catch (error) {
        // Not fatal — the gesture still works without capture.
      }

      this._clearPressTimers()
      this._pressIntentTimer = setTimeout(() => {
        if (!this._pressGesture) return
        this._pressGesture.tick(this._pressNow())
        this._syncPressState()
      }, PRESS_INTENT_DELAY_MS)
      this._pressCommitTimer = setTimeout(() => {
        if (!this._pressGesture) return
        this._pressGesture.tick(this._pressNow())
        this._syncPressState()
      }, PRESS_HOLD_COMMIT_MS)

      this._syncPressState()
    },

    onPressPointerMove(event) {
      const gesture = this._pressGesture
      if (!gesture) return
      gesture.move({
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        t: this._pressNow()
      })
      if (gesture.state === 'cancelled') {
        this.cancelPress(gesture.cancelReason)
        return
      }
      this._syncPressState()
    },

    onPressPointerUp(event) {
      const gesture = this._pressGesture
      if (!gesture) return
      const { outcome } = gesture.end({ pointerId: event.pointerId, t: this._pressNow() })
      this._clearPressTimers()
      this._releasePressCapture()
      this._pressGesture = null
      this._syncPressState()

      if (outcome === 'tap') {
        this.$emit('press-tap', event)
      }
      // A committed hold already fired press-commit; the click it generates is
      // suppressed in onPressClick.
    },

    onPressPointerCancel() {
      this.cancelPress('pointercancel')
    },

    onPressLostCapture() {
      this.cancelPress('lostpointercapture')
    },

    /**
     * Consume the synthetic click that follows a committed hold, exactly once.
     * Returns true when the caller should ignore the click.
     */
    onPressClick() {
      return !!this._pressClickSuppressor && this._pressClickSuppressor.shouldSuppress()
    },

    /**
     * Keyboard equivalent of a tap. Peek itself needs no key handling here:
     * both the Menu key and Shift+F10 raise a `contextmenu` event, which
     * onPressContextMenu already routes into Peek.
     */
    onPressKeydown(event) {
      if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
      // Space would otherwise scroll the shelf out from under the user.
      event.preventDefault()
      if (typeof this.clickCard === 'function') this.clickCard(event)
      else this.$emit('press-tap', event)
    },

    onPressContextMenu(event) {
      // Never let the native long-press menu appear over a shelf.
      if (event && event.preventDefault) event.preventDefault()

      // Android fires contextmenu at roughly 500 ms, after our own 420 ms
      // commit has already opened Peek. The armed suppressor is the signal that
      // a commit just happened, so this event is the platform echoing it back
      // rather than an independent request.
      if (this._pressClickSuppressor && this._pressClickSuppressor.isArmed) return
      if (this._pressGesture && this._pressGesture.state === 'committed') return

      this.$emit('press-commit', { invokedBy: 'contextmenu', originalEvent: event })
    },

    _onPressCommitted() {
      if (this._pressClickSuppressor) this._pressClickSuppressor.arm()
      this._clearPressTimers()
      this._syncPressState()
      if (this.$hapticsLongPressCommit) this.$hapticsLongPressCommit()
      this.$emit('press-commit', { invokedBy: 'longpress' })
    },

    cancelPress(reason) {
      if (this._pressGesture) {
        this._pressGesture.cancel(reason)
        this._pressGesture.destroy()
        this._pressGesture = null
      }
      this._clearPressTimers()
      this._releasePressCapture()
      if (this._pressClickSuppressor) this._pressClickSuppressor.disarm()
      this._syncPressState()
    }
  }
}
