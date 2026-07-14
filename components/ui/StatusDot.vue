<template>
  <span class="status-dot inline-block rounded-full flex-none" :class="dotClass" :style="dotStyle" :aria-label="ariaLabel" role="img" />
</template>

<script>
const TONE_CLASS = {
  online: 'bg-success',
  offline: 'bg-error',
  degraded: 'bg-warning',
  syncing: 'bg-fg-muted status-dot--pulse'
}

export default {
  props: {
    tone: {
      type: String,
      default: 'offline'
    },
    size: {
      type: [Number, String],
      default: 8
    },
    ariaLabel: {
      type: String,
      default: 'Connection status'
    }
  },
  computed: {
    dotClass() {
      return TONE_CLASS[this.tone] || TONE_CLASS.offline
    },
    dotStyle() {
      const s = Number(this.size) || 8
      return { width: `${s}px`, height: `${s}px` }
    }
  }
}
</script>

<style scoped>
.status-dot--pulse {
  animation: status-dot-pulse 1.2s ease-in-out infinite;
}
@keyframes status-dot-pulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 1;
  }
}
</style>
