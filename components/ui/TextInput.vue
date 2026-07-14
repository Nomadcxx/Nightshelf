<template>
  <div class="relative" :class="wrapperClass">
    <input
      v-model="input"
      ref="input"
      :autofocus="autofocus"
      :type="type"
      :disabled="disabled"
      :readonly="readonly"
      autocorrect="off"
      autocapitalize="none"
      autocomplete="off"
      :placeholder="placeholder"
      class="py-2 w-full outline-none disabled:text-fg-muted"
      :class="inputClass"
      @keyup="keyup"
      @focus="focused = true"
      @blur="focused = false"
    />
    <div v-if="prependIcon" class="absolute top-0 left-0 h-full px-2 flex items-center justify-center pointer-events-none">
      <ui-ph-icon v-if="variant === 'prompt'" :name="prependIcon" :size="18" class="text-fg-muted" />
      <span v-else class="material-symbols text-lg">{{ prependIcon }}</span>
    </div>
    <div v-if="clearable && input" class="absolute top-0 right-0 h-full px-2 flex items-center justify-center" @click.stop="clear">
      <ui-ph-icon v-if="variant === 'prompt'" name="close" :size="18" class="text-fg-muted" />
      <span v-else class="material-symbols text-lg">close</span>
    </div>
    <div v-else-if="!clearable && appendIcon" class="absolute top-0 right-0 h-full px-2 flex items-center justify-center">
      <ui-ph-icon v-if="variant === 'prompt'" :name="appendIcon" :size="18" class="text-fg-muted" />
      <span v-else class="material-symbols text-lg">{{ appendIcon }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    value: [String, Number],
    placeholder: String,
    type: String,
    disabled: Boolean,
    readonly: Boolean,
    borderless: Boolean,
    autofocus: {
      type: Boolean,
      default: true
    },
    bg: {
      type: String,
      default: 'bg'
    },
    rounded: {
      type: String,
      default: 'sm'
    },
    prependIcon: {
      type: String,
      default: null
    },
    appendIcon: {
      type: String,
      default: null
    },
    clearable: Boolean,
    variant: {
      type: String,
      default: 'default'
    }
  },
  data() {
    return {
      focused: false
    }
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
    isPrompt() {
      return this.variant === 'prompt'
    },
    wrapperClass() {
      if (!this.isPrompt) return ''
      const classes = ['prompt-field rounded-md bg-primary transition-shadow']
      if (this.focused) {
        classes.push('prompt-field--focused')
      } else {
        classes.push('prompt-field--idle')
      }
      return classes.join(' ')
    },
    inputClass() {
      if (this.isPrompt) {
        const classes = ['bg-transparent text-fg px-3']
        if (this.prependIcon) classes.push('pl-10')
        return classes.join(' ')
      }

      var classes = [`bg-${this.bg}`, `rounded-${this.rounded}`]
      if (this.disabled) classes.push('text-fg-muted')
      else classes.push('text-fg')

      if (this.prependIcon) classes.push('pl-10 pr-2')
      else classes.push('px-2')

      if (!this.borderless) classes.push('border border-border')
      return classes.join(' ')
    }
  },
  methods: {
    clear() {
      this.input = ''
    },
    focus() {
      if (this.$refs.input) {
        this.$refs.input.focus()
        this.$refs.input.click()
      }
    },
    keyup() {
      if (this.$refs.input) {
        this.input = this.$refs.input.value
      }
    }
  }
}
</script>

<style scoped>
.prompt-field--idle {
  border-left: 2px solid rgb(var(--color-border));
}
.prompt-field--focused {
  border-left: 2px solid rgb(var(--color-success));
  box-shadow: 0 0 0 3px rgba(55, 244, 153, 0.15);
}
input[type='time']::-webkit-calendar-picker-indicator {
  filter: invert(100%);
}
</style>
