<template>
  <div v-if="chips.length" class="w-full overflow-x-auto px-2 py-2 flex gap-2 items-center">
    <button
      v-for="chip in chips"
      :key="chip.value"
      type="button"
      class="flex-none px-2.5 py-1 rounded-full border font-mono text-xxs uppercase tracking-wider"
      :class="chip.value === activeFilter ? 'border-success text-success bg-success/10' : 'border-border text-fg-muted'"
      @click="select(chip.value)"
    >
      {{ chip.label }}
    </button>
  </div>
</template>

<script>
export default {
  props: {
    filterBy: {
      type: String,
      default: 'all'
    }
  },
  computed: {
    genres() {
      return this.$store.state.libraries.filterData?.genres || []
    },
    chips() {
      const items = [{ value: 'all', label: 'All' }]
      for (const genre of this.genres.slice(0, 12)) {
        items.push({
          value: `genres.${this.$encode(genre)}`,
          label: genre
        })
      }
      return items
    },
    activeFilter() {
      return this.filterBy || 'all'
    }
  },
  methods: {
    select(value) {
      this.$emit('change', value)
    }
  }
}
</script>
