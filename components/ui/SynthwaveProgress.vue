<template>
  <div
    class="synthwave-progress"
    :class="[`synthwave-progress--${variant}`, { 'synthwave-progress--playing': playing }]"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(normalizedProgress * 100)"
  >
    <div v-if="hasBuffered" class="synthwave-progress__buffered" :style="{ width: `${normalizedBuffered * 100}%` }" />
    <div class="synthwave-progress__fill" :style="{ width: `${normalizedProgress * 100}%` }" />
  </div>
</template>

<script>
export default {
  props: {
    progress: {
      type: Number,
      default: 0
    },
    buffered: {
      type: Number,
      default: null
    },
    playing: Boolean,
    variant: {
      type: String,
      default: 'full',
      validator: (value) => ['full', 'mini'].includes(value)
    }
  },
  computed: {
    normalizedProgress() {
      return this.normalize(this.progress)
    },
    normalizedBuffered() {
      return this.normalize(this.buffered)
    },
    hasBuffered() {
      return this.buffered !== null && this.buffered !== undefined
    }
  },
  methods: {
    normalize(value) {
      return Math.min(1, Math.max(0, Number(value) || 0))
    }
  }
}
</script>

<style scoped>
.synthwave-progress {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  background: rgb(var(--color-track) / 0.5);
}

.synthwave-progress__buffered,
.synthwave-progress__fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: inherit;
  pointer-events: none;
}

.synthwave-progress__buffered {
  background: rgb(var(--color-track-buffered) / 0.9);
}

.synthwave-progress__fill {
  background: linear-gradient(90deg, #37f499 0%, #04d1f9 50%, #a48cf2 100%);
  background-size: 200% 100%;
  box-shadow: 0 0 10px rgb(4 209 249 / 0.45);
}

.synthwave-progress--mini .synthwave-progress__fill {
  box-shadow: none;
}

.synthwave-progress--playing .synthwave-progress__fill {
  animation: nightshelf-synthwave 2.4s linear infinite;
}
</style>
