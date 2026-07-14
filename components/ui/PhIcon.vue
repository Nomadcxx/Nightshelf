<template>
  <svg v-if="path" class="ph-icon" :width="size" :height="size" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
    <path :d="path" />
  </svg>
</template>

<script>
import { iconPaths } from '@/assets/icons/phosphor-map'

export default {
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 24
    },
    weight: {
      type: String,
      default: 'regular'
    }
  },
  computed: {
    path() {
      const icon = iconPaths[this.name]
      return icon && (icon[this.weight] || icon.regular)
    }
  }
}
</script>
