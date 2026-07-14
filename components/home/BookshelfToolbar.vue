<template>
  <div class="w-full relative z-20">
    <div class="w-full h-9 bg-secondary border-b border-border relative">
      <div id="bookshelf-toolbar" class="absolute top-0 left-0 w-full h-full z-20 flex items-center px-2">
        <div class="flex items-center w-full text-sm">
          <p v-show="!selectedSeriesName" class="font-mono text-xxs uppercase tracking-widest text-fg-muted">{{ $formatNumber(totalEntities) }} {{ entityTitle }}</p>
          <p v-show="selectedSeriesName" class="ml-1 truncate text-sm">{{ selectedSeriesName }} ({{ $formatNumber(totalEntities) }})</p>
          <div class="flex-grow" />
          <ui-icon-btn v-if="page == 'library'" class="h-8 w-8 text-fg-muted" borderless :icon="libraryViewMode === 'rails' ? 'grid_view' : 'view_list'" @click="changeLibraryViewMode" />
          <ui-icon-btn v-else-if="seriesBookPage" class="h-8 w-8 text-fg-muted" borderless :icon="!bookshelfListView ? 'view_list' : 'grid_view'" @click="changeView" />
          <template v-if="page === 'library'">
            <div class="relative flex items-center">
              <ui-icon-btn class="h-8 w-8 text-fg-muted" borderless icon="filter_alt" @click="showFilterModal = true" />
              <div v-show="hasFilters" class="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-success border border-secondary shadow-sm z-10 pointer-events-none" />
            </div>
            <ui-icon-btn class="h-8 w-8 text-fg-muted" borderless icon="sort" @click="showSortModal = true" />
          </template>
          <ui-icon-btn v-if="seriesBookPage" class="h-8 w-8 text-fg-muted" borderless icon="download" @click="downloadSeries" />
          <ui-icon-btn v-if="(page == 'library' && isBookLibrary) || seriesBookPage" class="h-8 w-8 text-fg-muted" borderless icon="more_vert" @click="showMoreMenuDialog = true" />
        </div>
      </div>
    </div>

    <home-library-genre-chips v-if="page === 'library' && isBookLibrary" :filter-by="settings.mobileFilterBy || 'all'" @change="applyGenreChip" />

    <modals-order-modal v-model="showSortModal" :order-by.sync="settings.mobileOrderBy" :descending.sync="settings.mobileOrderDesc" @change="updateOrder" />
    <modals-filter-modal v-model="showFilterModal" :filter-by.sync="settings.mobileFilterBy" @change="updateFilter" />
    <modals-dialog v-model="showMoreMenuDialog" :items="menuItems" @action="clickMenuAction" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      showSortModal: false,
      showFilterModal: false,
      settings: {},
      totalEntities: 0,
      showMoreMenuDialog: false
    }
  },
  computed: {
    bookshelfListView: {
      get() {
        return this.$store.state.globals.bookshelfListView
      },
      set(val) {
        this.$localStore.setBookshelfListView(val)
        this.$store.commit('globals/setBookshelfListView', val)
      }
    },
    libraryViewMode() {
      return this.$store.state.globals.libraryViewMode || 'rails'
    },
    currentLibraryMediaType() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType']
    },
    isBookLibrary() {
      return this.currentLibraryMediaType === 'book'
    },
    hasFilters() {
      return this.$store.getters['user/getUserSetting']('mobileFilterBy') !== 'all'
    },
    page() {
      var routeName = this.$route.name || ''
      return routeName.split('-')[1]
    },
    seriesBookPage() {
      return this.$route.name == 'bookshelf-series-id'
    },
    routeQuery() {
      return this.$route.query || {}
    },
    entityTitle() {
      if (this.page === 'library') {
        return this.isPodcast ? this.$strings.LabelPodcasts : this.$strings.LabelBooks
      } else if (this.page === 'playlists') {
        return this.$strings.ButtonPlaylists
      } else if (this.page === 'series') {
        return this.$strings.LabelSeries
      } else if (this.page === 'collections') {
        return this.$strings.ButtonCollections
      } else if (this.page === 'authors') {
        return this.$strings.LabelAuthors
      }
      return ''
    },
    selectedSeriesName() {
      if (this.page === 'series' && this.$route.params.id && this.$store.state.globals.series) {
        return this.$store.state.globals.series.name
      }
      return null
    },
    isPodcast() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType'] === 'podcast'
    },
    menuItems() {
      if (!this.isBookLibrary) return []

      if (this.seriesBookPage) {
        return [
          {
            text: this.$strings.LabelCollapseSeries,
            value: 'collapse_subseries',
            icon: this.settings.collapseBookSeries ? 'check_box' : 'check_box_outline_blank'
          }
        ]
      } else {
        return [
          {
            text: this.$strings.LabelCollapseSeries,
            value: 'collapse_series',
            icon: this.settings.collapseSeries ? 'check_box' : 'check_box_outline_blank'
          }
        ]
      }
    }
  },
  methods: {
    clickMenuAction(action) {
      this.showMoreMenuDialog = false
      if (action === 'collapse_series') {
        this.settings.collapseSeries = !this.settings.collapseSeries
        this.saveSettings()
      } else if (action === 'collapse_subseries') {
        this.settings.collapseBookSeries = !this.settings.collapseBookSeries
        this.saveSettings()
      }
    },
    updateOrder() {
      this.saveSettings()
    },
    updateFilter() {
      this.saveSettings()
    },
    applyGenreChip(value) {
      this.settings.mobileFilterBy = value
      this.saveSettings()
    },
    saveSettings() {
      this.$store.dispatch('user/updateUserSettings', this.settings)
    },
    async init() {
      this.bookshelfListView = await this.$localStore.getBookshelfListView()
      const mode = await this.$localStore.getLibraryViewMode()
      this.$store.commit('globals/setLibraryViewMode', mode)
      this.settings = { ...this.$store.state.user.settings }
      this.bookshelfReady = true
    },
    settingsUpdated(settings) {
      for (const key in settings) {
        this.settings[key] = settings[key]
      }
    },
    setTotalEntities(total) {
      this.totalEntities = total
    },
    async changeView() {
      this.bookshelfListView = !this.bookshelfListView
      await this.$hapticsImpact()
    },
    async changeLibraryViewMode() {
      const next = this.libraryViewMode === 'rails' ? 'grid' : 'rails'
      this.$store.commit('globals/setLibraryViewMode', next)
      await this.$localStore.setLibraryViewMode(next)
      await this.$hapticsImpact()
    },
    downloadSeries() {
      console.log('Download Series click')
      this.$eventBus.$emit('download-series-click')
    }
  },
  mounted() {
    this.init()
    this.$eventBus.$on('bookshelf-total-entities', this.setTotalEntities)
    this.$eventBus.$on('user-settings', this.settingsUpdated)
  },
  beforeDestroy() {
    this.$eventBus.$off('bookshelf-total-entities', this.setTotalEntities)
    this.$eventBus.$off('user-settings', this.settingsUpdated)
  }
}
</script>

<style>
#bookshelf-toolbar {
  box-shadow: 0 2px 6px rgb(var(--color-bg) / 0.35);
}
</style>
