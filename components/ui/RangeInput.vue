<template>
  <div class="inline-flex min-h-12 items-center">
    <input v-model="input" type="range" :min="min" :max="max" :step="step" :style="{ width: inputWidth, '--range-progress': `${progressPercent}%` }" />

    <p class="min-w-12 ml-3 font-mono text-xs text-fg-muted">{{ input }}%</p>
  </div>
</template>

<script>
export default {
  props: {
    value: [String, Number],
    min: Number,
    max: Number,
    step: Number,
    inputWidth: {
      type: String,
      default: 'unset'
    }
  },
  data() {
    return {}
  },
  computed: {
    input: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    progressPercent() {
      const range = Number(this.max) - Number(this.min)
      if (!range) return 0
      return Math.min(100, Math.max(0, ((Number(this.input) - Number(this.min)) / range) * 100))
    }
  },
  methods: {},
  mounted() {}
}
</script>

<style scoped>
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  min-height: 48px;
}
input[type='range']:focus {
  outline: none;
}

/* chromium */
input[type='range']::-webkit-slider-runnable-track {
  background: linear-gradient(90deg, rgb(var(--color-success)) 0%, rgb(var(--color-info)) var(--range-progress), rgb(var(--color-track) / 0.55) var(--range-progress));
  border: 1px solid rgb(var(--color-border));
  border-radius: 3px;
  height: 0.4rem;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  margin-top: -0.42rem;
  border: 1px solid rgb(var(--color-fg) / 0.8);
  border-radius: 5px;
  background: linear-gradient(135deg, rgb(var(--color-info)), rgb(var(--color-accent)));
  box-shadow: 0 0 10px rgb(4 209 249 / 0.5);
  height: 1.25rem;
  width: 1rem;
}
input[type='range']:focus::-webkit-slider-thumb {
  border: 1px solid rgb(var(--color-track));
  outline: 3px solid rgb(var(--color-track));
  outline-offset: 0.125rem;
}

/* firefox */
input[type='range']::-moz-range-track {
  background: rgb(var(--color-track) / 0.55);
  border: 1px solid rgb(var(--color-border));
  border-radius: 3px;
  height: 0.4rem;
}
input[type='range']::-moz-range-thumb {
  border: 1px solid rgb(var(--color-fg) / 0.8);
  border-radius: 5px;
  background: linear-gradient(135deg, rgb(var(--color-info)), rgb(var(--color-accent)));
  box-shadow: 0 0 10px rgb(4 209 249 / 0.5);
  height: 1.25rem;
  width: 1.25rem;
}
input[type='range']:focus::-moz-range-thumb {
  border: 1px solid rgb(var(--color-track));
  outline: 3px solid rgb(var(--color-track));
  outline-offset: 0.125rem;
}
</style>
