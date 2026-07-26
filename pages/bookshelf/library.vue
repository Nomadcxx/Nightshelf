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
    <bookshelf-lazy-bookshelf v-else page="books" :view-mode="viewMode" />
  </div>
</template>

<script>
import { buildLibraryItemsQuery, getLibraryItemsTotal } from '@/utils/libraryItemsQuery'

export default {
  async asyncData({ store, query }) {
    if (query.filter) {
      await store.dispatch('user/updateUserSettings', { mobileFilterBy: query.filter })
    }
  },
  data() {
    return {
      shelves: [],
      isLoading: false,
      fetchRequestId: 0
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
    },
    orderBy() {
      return this.$store.getters['user/getUserSetting']('mobileOrderBy')
    },
    orderDesc() {
      return this.$store.getters['user/getUserSetting']('mobileOrderDesc')
    },
    collapseSeries() {
      return this.$store.getters['user/getUserSetting']('collapseSeries')
    },
    currentLibraryMediaType() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType']
    },
    libraryItemsQuery() {
      return buildLibraryItemsQuery({
        filterBy: this.filterBy,
        orderBy: this.orderBy,
        orderDesc: this.orderDesc,
        collapseSeries: this.collapseSeries
      })
    }
  },
  watch: {
    viewMode(mode) {
      if (mode === 'rails') this.fetchRails()
    },
    currentLibraryId() {
      if (this.viewMode === 'rails') this.fetchRails()
    },
    libraryItemsQuery() {
      if (this.viewMode === 'rails') this.fetchRails()
    }
  },
  methods: {
    getShelfLabel(shelf) {
      if (shelf.labelStringKey && this.$strings[shelf.labelStringKey]) return this.$strings[shelf.labelStringKey]
      return shelf.label
    },
    getAllItemsLabel(total) {
      const label = this.currentLibraryMediaType === 'podcast' ? this.$strings.LabelAllPodcasts : this.$strings.LabelAllBooks
      return `${label} · ${this.$formatNumber(total)}`
    },
    emitTotalEntities(total) {
      this.$eventBus.$emit('bookshelf-total-entities', total)
    },
    async fetchRails() {
      const requestId = ++this.fetchRequestId
      if (!this.currentLibraryId) {
        this.shelves = []
        this.emitTotalEntities(0)
        return
      }
      this.isLoading = true
      this.emitTotalEntities(0)

      const [categories, itemsPayload] = await Promise.all([
        this.$nativeHttp.get(`/api/libraries/${this.currentLibraryId}/personalized?limit=24&include=rssfeed,numEpisodesIncomplete`).catch(() => null),
        this.$nativeHttp.get(`/api/libraries/${this.currentLibraryId}/items?${this.libraryItemsQuery}`).catch(() => null)
      ])

      if (requestId !== this.fetchRequestId) return
      this.isLoading = false

      const total = getLibraryItemsTotal(itemsPayload)
      if (total === null) {
        this.shelves = []
        this.emitTotalEntities(0)
        return
      }

      const allItemsShelf = itemsPayload.results.length
        ? [
            {
              id: 'all-library-items',
              label: this.getAllItemsLabel(total),
              type: this.currentLibraryMediaType,
              entities: itemsPayload.results
            }
          ]
        : []

      if (this.filterBy && this.filterBy !== 'all') {
        this.shelves = allItemsShelf
      } else {
        const personalizedShelves = Array.isArray(categories) ? categories.filter((category) => category.entities?.length) : []
        this.shelves = [...allItemsShelf, ...personalizedShelves]
      }
      this.emitTotalEntities(total)
    }
  },
  async mounted() {
    const mode = await this.$localStore.getLibraryViewMode()
    this.$store.commit('globals/setLibraryViewMode', mode)
    if (mode === 'rails') this.fetchRails()
  }
}
</script>
