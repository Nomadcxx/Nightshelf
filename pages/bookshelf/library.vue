<template>
  <div class="w-full h-full">
    <div v-if="viewMode === 'rails'" class="w-full py-2">
      <div v-if="isLoading" class="w-full pt-4 flex items-center justify-center">
        <widgets-loading-spinner />
        <p class="pl-4">{{ $strings.MessageLoadingServerData }}</p>
      </div>
      <template v-for="(shelf, index) in shelves">
        <bookshelf-shelf :key="shelf.id" :label="getShelfLabel(shelf)" :entities="shelf.entities" :type="shelf.type" :style="{ zIndex: shelves.length - index }" />
      </template>
      <div v-if="!isLoading && !shelves.length" class="px-6 py-12 text-center font-mono text-sm uppercase tracking-widest text-fg-muted">
        {{ $strings.MessageBookshelfEmpty }}
      </div>
    </div>
    <bookshelf-lazy-bookshelf v-else page="books" />
  </div>
</template>

<script>
export default {
  async asyncData({ store, query }) {
    if (query.filter) {
      await store.dispatch('user/updateUserSettings', { mobileFilterBy: query.filter })
    }
  },
  data() {
    return {
      shelves: [],
      isLoading: false
    }
  },
  computed: {
    viewMode() {
      return this.$store.state.globals.libraryViewMode || 'rails'
    },
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    filterBy() {
      return this.$store.getters['user/getUserSetting']('mobileFilterBy') || 'all'
    }
  },
  watch: {
    viewMode(mode) {
      if (mode === 'rails') this.fetchRails()
    },
    currentLibraryId() {
      if (this.viewMode === 'rails') this.fetchRails()
    },
    filterBy() {
      if (this.viewMode === 'rails') this.fetchRails()
    }
  },
  methods: {
    getShelfLabel(shelf) {
      if (shelf.labelStringKey && this.$strings[shelf.labelStringKey]) return this.$strings[shelf.labelStringKey]
      return shelf.label
    },
    countUniqueShelfEntities(shelves) {
      const ids = new Set()
      for (const shelf of shelves) {
        for (const entity of shelf.entities || []) {
          const id = entity.id || entity.recentEpisode?.id
          if (id) ids.add(id)
        }
      }
      return ids.size
    },
    emitTotalEntities() {
      this.$eventBus.$emit('bookshelf-total-entities', this.countUniqueShelfEntities(this.shelves))
    },
    async fetchRails() {
      if (!this.currentLibraryId) {
        this.shelves = []
        this.emitTotalEntities()
        return
      }
      this.isLoading = true
      const categories = await this.$nativeHttp.get(`/api/libraries/${this.currentLibraryId}/personalized?limit=24&include=rssfeed,numEpisodesIncomplete`).catch(() => null)
      this.isLoading = false
      if (!Array.isArray(categories)) {
        this.shelves = []
        this.emitTotalEntities()
        return
      }
      let shelves = categories.filter((c) => c.entities?.length)
      // When a genre chip/filter is active, keep shelves whose label/id matches when possible;
      // otherwise fall through to dense grid for accurate filtered hunting.
      if (this.filterBy && this.filterBy !== 'all' && this.filterBy.startsWith('genres.')) {
        const genreToken = decodeURIComponent(this.filterBy.replace(/^genres\./, '')).toLowerCase()
        const filtered = shelves.filter((s) => String(s.label || s.id || '').toLowerCase().includes(genreToken))
        if (filtered.length) shelves = filtered
      }
      this.shelves = shelves
      this.emitTotalEntities()
    }
  },
  async mounted() {
    const mode = await this.$localStore.getLibraryViewMode()
    this.$store.commit('globals/setLibraryViewMode', mode)
    if (mode === 'rails') this.fetchRails()
  }
}
</script>
