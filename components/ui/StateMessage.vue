<template>
  <div v-if="described.isMessage && visible" class="ns-state-message w-full flex flex-col items-center justify-center text-center px-8" :class="compact ? 'py-8' : 'py-16'" role="status" :aria-busy="state === 'loading'">
    <div v-if="state === 'loading'" class="ns-state-spinner" aria-hidden="true" />
    <ui-ph-icon v-else :name="described.icon" :size="40" class="ns-state-icon" />

    <p class="ns-state-title mt-3">{{ title }}</p>
    <p v-if="body" class="ns-state-body mt-1">{{ body }}</p>

    <button v-if="described.canRetry" type="button" class="ns-state-action mt-4" @click="$emit('retry')">
      {{ $strings.ButtonRetry }}
    </button>
  </div>
</template>

<script>
import { describeViewState, shouldRenderState, LOADING_CHROME_DELAY_MS } from '@/utils/appStates'

/**
 * The one place empty, loading, offline and error are drawn.
 *
 * Views decide *which* state they are in (utils/appStates.js) and this decides
 * how it looks, so a shelf, a search page and a downloads list cannot end up
 * telling the user the same thing three different ways.
 */
export default {
  props: {
    /** One of APP_STATES. */
    state: {
      type: String,
      required: true
    },
    /** Overrides a state's default message where a view has a better one. */
    titleKey: String,
    bodyKey: String,
    compact: Boolean
  },
  data() {
    return {
      // Loading chrome is withheld briefly so a fast load never flashes a
      // spinner. Conclusive states show at once — see shouldRenderState.
      visible: shouldRenderState(this.state, Infinity),
      delayTimer: null
    }
  },
  watch: {
    state: {
      immediate: true,
      handler(newState) {
        clearTimeout(this.delayTimer)
        this.delayTimer = null

        if (shouldRenderState(newState, Infinity) && newState !== 'loading') {
          this.visible = true
          return
        }
        this.visible = false
        this.delayTimer = setTimeout(() => {
          // Guard against the state having moved on while we waited.
          if (this.state === 'loading') this.visible = true
          this.delayTimer = null
        }, LOADING_CHROME_DELAY_MS)
      }
    }
  },
  beforeDestroy() {
    clearTimeout(this.delayTimer)
  },
  computed: {
    described() {
      const overrides = {}
      if (this.titleKey) overrides.titleKey = this.titleKey
      if (this.bodyKey) overrides.bodyKey = this.bodyKey
      return describeViewState(this.state, overrides)
    },
    title() {
      return this.$strings[this.described.titleKey] || this.described.titleKey
    },
    body() {
      if (!this.described.bodyKey) return ''
      return this.$strings[this.described.bodyKey] || ''
    }
  }
}
</script>

<style scoped>
.ns-state-icon {
  color: rgb(var(--color-fg) / 0.4);
}

.ns-state-title {
  color: rgb(var(--color-fg) / 0.85);
  font-size: 0.95rem;
}

.ns-state-body {
  color: rgb(var(--color-fg) / 0.55);
  font-size: 0.8rem;
  max-width: 22rem;
}

.ns-state-action {
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: 999px;
  border: 1px solid rgb(var(--color-fg) / 0.25);
  color: rgb(var(--color-fg));
  font-size: 0.85rem;
  transition: opacity var(--motion-instant) var(--ease-night-out);
}

.ns-state-action:active {
  opacity: 0.6;
}

/* Rotation is the one exception to transform-only economy: it communicates
   "still working" and has no other way to be expressed. */
.ns-state-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgb(var(--color-fg) / 0.18);
  border-top-color: rgb(var(--color-fg) / 0.65);
  animation: ns-state-spin 900ms linear infinite;
}

@keyframes ns-state-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Reduced motion keeps the indicator — removing it would remove the only
   signal that work is in progress — but stops it spinning. */
[data-motion='reduced'] .ns-state-spinner {
  animation: none;
  border-top-color: rgb(var(--color-fg) / 0.4);
}

@media (prefers-reduced-motion: reduce) {
  .ns-state-spinner {
    animation: none;
    border-top-color: rgb(var(--color-fg) / 0.4);
  }
}
</style>
