<template>
  <div
    class="synthwave-progress"
    :class="[`synthwave-progress--${variant}`, { 'synthwave-progress--playing': playing }]"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(normalizedProgress * 100)"
  >
    <svg class="synthwave-progress__svg" viewBox="0 0 100 18" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="1" y2="0">
          <!-- Stops carry classes rather than stop-color attributes: var() inside
               an SVG presentation attribute is not reliably supported, whereas
               the same custom property resolves normally from a stylesheet. -->
          <stop offset="0" class="synthwave-progress__stop-a" />
          <stop offset="0.52" class="synthwave-progress__stop-b" />
          <stop offset="1" class="synthwave-progress__stop-c" />
        </linearGradient>
        <filter :id="glowId" x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="1.15" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath :id="bufferClipId" clipPathUnits="userSpaceOnUse">
          <rect x="0" y="0" :width="normalizedBuffered * 100" height="18" />
        </clipPath>
        <clipPath :id="progressClipId" clipPathUnits="userSpaceOnUse">
          <rect x="0" y="0" :width="normalizedProgress * 100" height="18" />
        </clipPath>
      </defs>

      <path class="synthwave-progress__baseline" :d="wavePath" pathLength="100" />
      <path v-if="hasBuffered" class="synthwave-progress__buffered" :d="wavePath" pathLength="100" :clip-path="`url(#${bufferClipId})`" />
      <path class="synthwave-progress__glow" :d="wavePath" pathLength="100" :clip-path="`url(#${progressClipId})`" :stroke="`url(#${gradientId})`" :filter="`url(#${glowId})`" />
      <path class="synthwave-progress__signal" :d="wavePath" pathLength="100" :clip-path="`url(#${progressClipId})`" :stroke="`url(#${gradientId})`" />
    </svg>
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
    },
    gradientId() {
      return `synthwave-gradient-${this._uid}`
    },
    glowId() {
      return `synthwave-glow-${this._uid}`
    },
    bufferClipId() {
      return `synthwave-buffer-${this._uid}`
    },
    progressClipId() {
      return `synthwave-progress-${this._uid}`
    },
    wavePath() {
      const cycles = this.variant === 'mini' ? 10 : 12
      const amplitude = this.variant === 'mini' ? 2 : 2.55
      const cycleWidth = 100 / cycles
      const commands = ['M0 9']

      for (let cycle = 0; cycle < cycles; cycle += 1) {
        const start = cycle * cycleWidth
        const quarter = cycleWidth / 4
        const eighth = cycleWidth / 8
        const peak = 9 - amplitude
        const trough = 9 + amplitude

        commands.push(`C${(start + eighth).toFixed(3)} 9 ${(start + quarter - eighth).toFixed(3)} ${peak.toFixed(3)} ${(start + quarter).toFixed(3)} ${peak.toFixed(3)}`)
        commands.push(`C${(start + quarter + eighth).toFixed(3)} ${peak.toFixed(3)} ${(start + quarter * 2 - eighth).toFixed(3)} 9 ${(start + quarter * 2).toFixed(3)} 9`)
        commands.push(`C${(start + quarter * 2 + eighth).toFixed(3)} 9 ${(start + quarter * 3 - eighth).toFixed(3)} ${trough.toFixed(3)} ${(start + quarter * 3).toFixed(3)} ${trough.toFixed(3)}`)
        commands.push(`C${(start + quarter * 3 + eighth).toFixed(3)} ${trough.toFixed(3)} ${(start + cycleWidth - eighth).toFixed(3)} 9 ${(start + cycleWidth).toFixed(3)} 9`)
      }

      return commands.join(' ')
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
.synthwave-progress__stop-a {
  stop-color: rgb(var(--color-success));
}
.synthwave-progress__stop-b {
  stop-color: rgb(var(--color-info));
}
.synthwave-progress__stop-c {
  stop-color: rgb(var(--color-accent));
}

.synthwave-progress {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.synthwave-progress__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.synthwave-progress__baseline,
.synthwave-progress__buffered,
.synthwave-progress__glow,
.synthwave-progress__signal {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.synthwave-progress__baseline {
  stroke: rgb(var(--color-track) / 0.6);
  stroke-width: 1.15;
}

.synthwave-progress__buffered {
  stroke: rgb(var(--color-track-buffered) / 0.88);
  stroke-width: 1.35;
}

.synthwave-progress__glow {
  opacity: 0.44;
  stroke-width: 2.2;
}

.synthwave-progress__signal {
  stroke-width: 1.55;
}

.synthwave-progress--mini .synthwave-progress__glow {
  opacity: 0.34;
  stroke-width: 1.9;
}

.synthwave-progress--mini .synthwave-progress__signal {
  stroke-width: 1.35;
}

.synthwave-progress--playing .synthwave-progress__glow {
  animation: nightshelf-wave-glow 1.8s ease-in-out infinite alternate;
}

@keyframes nightshelf-wave-glow {
  from { opacity: 0.32; }
  to { opacity: 0.58; }
}

@media (prefers-reduced-motion: reduce) {
  .synthwave-progress--playing .synthwave-progress__glow {
    animation: none;
  }
}
</style>
