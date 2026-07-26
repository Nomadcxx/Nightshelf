<template>
  <div class="w-full">
    <div v-if="isLoading" class="min-h-12 px-3 flex items-center gap-2 border-y border-border bg-bg">
      <widgets-loading-spinner size="la-sm" />
      <p class="font-mono text-xs uppercase tracking-wider text-fg-muted">Loading genres</p>
    </div>
    <ui-facet-strip v-else-if="chips.length" prompt="Genre" aria-label="Filter library by genre" :items="chips" :value="activeFilter" @select="select" />
  </div>
</template>

<script>
import { selectQuickGenres } from '@/utils/libraryGenreChips'

export default {
  props: {
    filterBy: {
      type: String,
      default: 'all'
    }
  },
  computed: {
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    isLoading() {
      return Boolean(this.$store.state.user.user && this.currentLibraryId && !this.$store.state.libraries.filterData)
    },
    genres() {
      return this.$store.state.libraries.filterData?.genres || []
    },
    chips() {
      const items = [{ value: 'all', label: 'All' }]
      for (const genre of selectQuickGenres(this.genres, this.activeFilter, 12)) {
        items.push({
          value: `genres.${this.$encode(genre)}`,
          label: genre
        })
      }
      return items
    },
    activeFilter() {
      return this.filterBy || this.$store.getters['user/getUserSetting']('mobileFilterBy') || 'all'
    }
  },
  methods: {
    select(value) {
      this.$emit('change', value)
    }
  }
}
</script>
