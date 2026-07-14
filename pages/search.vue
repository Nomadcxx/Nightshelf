<template>
  <div class="w-full h-full">
    <div class="px-4 pt-4 pb-2">
      <p class="font-mono text-xxs uppercase tracking-widest text-success mb-2">search</p>
      <ui-text-input ref="input" v-model="search" variant="prompt" prepend-icon="search" :placeholder="$strings.ButtonSearch" clearable class="w-full" :autofocus="true" @input="updateSearch" />
    </div>

    <div v-if="!lastSearch" class="px-4 pb-4 overflow-y-auto search-idle">
      <div v-if="suggestionsLoading" class="py-4 flex items-center gap-2">
        <widgets-loading-spinner size="la-sm" />
        <p class="font-mono text-xxs uppercase tracking-wider text-fg-muted">Loading suggestions</p>
      </div>
      <template v-else-if="suggestionShelves.length">
        <div v-for="shelf in suggestionShelves" :key="shelf.id" class="mb-4">
          <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted mb-2">{{ shelf.label }}</p>
          <div class="flex gap-3 overflow-x-auto pb-1">
            <nuxt-link
              v-for="entity in shelf.entities.slice(0, 12)"
              :key="entity.id || entity.recentEpisode?.id"
              :to="suggestionLink(entity, shelf.type)"
              class="flex-none w-20"
            >
              <div class="w-20 h-28 rounded bg-secondary overflow-hidden border border-border">
                <img v-if="coverFor(entity)" :src="coverFor(entity)" class="w-full h-full object-cover" alt="" />
              </div>
            </nuxt-link>
          </div>
        </div>
      </template>
      <p v-else class="text-fg-muted text-sm font-mono">Type to search your library</p>
    </div>

    <div v-else class="w-full overflow-x-hidden overflow-y-auto search-content px-4" @click.stop>
      <div class="flex gap-2 overflow-x-auto pb-3">
        <button
          v-for="chip in chips"
          :key="chip"
          type="button"
          class="flex-none px-2.5 py-1 rounded-full border font-mono text-xxs uppercase tracking-wider"
          :class="chip === activeChip ? 'border-accent text-accent bg-accent/10' : 'border-border text-fg-muted'"
          @click="activeChip = chip"
        >
          {{ chip }}
        </button>
      </div>

      <div v-show="isFetching" class="w-full py-8 flex justify-center">
        <p class="text-lg text-fg-muted">{{ $strings.MessageFetching }}</p>
      </div>
      <div v-if="!isFetching && lastSearch && !totalResults" class="w-full py-8 flex justify-center">
        <p class="text-lg text-fg-muted">{{ $strings.MessageNoItemsFound }}</p>
      </div>

      <template v-if="showGroup('books') && bookResults.length">
        <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted mb-1">{{ $strings.LabelBooks }}</p>
        <template v-for="item in bookResults">
          <div :key="item.libraryItem.id" class="w-full py-1 border-b border-border">
            <nuxt-link :to="`/item/${item.libraryItem.id}`">
              <cards-item-search-card :library-item="item.libraryItem" :search="lastSearch" />
            </nuxt-link>
          </div>
        </template>
      </template>

      <template v-if="showGroup('podcasts') && podcastResults.length">
        <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted mb-1 mt-2">{{ $strings.LabelPodcasts }}</p>
        <template v-for="item in podcastResults">
          <div :key="item.libraryItem.id" class="text-fg select-none relative py-1 border-b border-border">
            <nuxt-link :to="`/item/${item.libraryItem.id}`">
              <cards-item-search-card :library-item="item.libraryItem" :search="lastSearch" />
            </nuxt-link>
          </div>
        </template>
      </template>

      <template v-if="showGroup('podcasts') && episodeResults.length">
        <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted mb-1 mt-2">{{ $strings.HeaderEpisodes }}</p>
        <template v-for="item in episodeResults">
          <div :key="item.libraryItem.recentEpisode.id" class="text-fg select-none relative py-1 border-b border-border">
            <nuxt-link :to="`/item/${item.libraryItem.id}/${item.libraryItem.recentEpisode.id}`">
              <cards-episode-search-card :episode="item.libraryItem.recentEpisode" :library-item="item.libraryItem" />
            </nuxt-link>
          </div>
        </template>
      </template>

      <template v-if="showGroup('series') && seriesResults.length">
        <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted mb-1 mt-2">{{ $strings.LabelSeries }}</p>
        <template v-for="seriesResult in seriesResults">
          <div :key="seriesResult.series.id" class="w-full py-1 border-b border-border">
            <nuxt-link :to="`/bookshelf/series/${seriesResult.series.id}`">
              <cards-series-search-card :series="seriesResult.series" :book-items="seriesResult.books" />
            </nuxt-link>
          </div>
        </template>
      </template>

      <template v-if="showGroup('authors') && authorResults.length">
        <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted mb-1 mt-2">{{ $strings.LabelAuthors }}</p>
        <template v-for="authorResult in authorResults">
          <div :key="authorResult.id" class="w-full py-1 border-b border-border">
            <nuxt-link :to="`/bookshelf/library?filter=authors.${$encode(authorResult.id)}`">
              <cards-author-search-card :author="authorResult" />
            </nuxt-link>
          </div>
        </template>
      </template>

      <template v-if="showGroup('narrators') && narratorResults.length">
        <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted mb-1 mt-2">{{ $strings.LabelNarrators }}</p>
        <template v-for="narrator in narratorResults">
          <div :key="narrator.name" class="w-full py-1 border-b border-border">
            <nuxt-link :to="`/bookshelf/library?filter=narrators.${$encode(narrator.name)}`">
              <cards-narrator-search-card :narrator="narrator.name" />
            </nuxt-link>
          </div>
        </template>
      </template>

      <template v-if="showGroup('tags') && tagResults.length">
        <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted mb-1 mt-2">{{ $strings.LabelTags }}</p>
        <template v-for="tag in tagResults">
          <div :key="tag.name" class="w-full py-1 border-b border-border">
            <nuxt-link :to="`/bookshelf/library?filter=tags.${$encode(tag.name)}`">
              <cards-tag-search-card :tag="tag.name" />
            </nuxt-link>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script>
import { SEARCH_CHIPS, visibleGroups } from '@/utils/searchChips'

export default {
  data() {
    return {
      search: null,
      searchTimeout: null,
      lastSearch: null,
      isFetching: false,
      activeChip: 'all',
      chips: SEARCH_CHIPS,
      suggestionShelves: [],
      suggestionsLoading: false,
      bookResults: [],
      podcastResults: [],
      episodeResults: [],
      seriesResults: [],
      authorResults: [],
      narratorResults: [],
      tagResults: []
    }
  },
  computed: {
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    totalResults() {
      return this.bookResults.length + this.seriesResults.length + this.authorResults.length + this.podcastResults.length + this.narratorResults.length + this.tagResults.length + this.episodeResults.length
    }
  },
  watch: {
    currentLibraryId() {
      this.loadSuggestions()
    }
  },
  methods: {
    showGroup(name) {
      return visibleGroups(this.activeChip, [name]).includes(name)
    },
    coverFor(entity) {
      return this.$store.getters['globals/getLibraryItemCoverSrc'](entity, null, true) || this.$store.getters['globals/getLibraryItemCoverSrcById'](entity.id)
    },
    suggestionLink(entity, type) {
      if (type === 'episode' && entity.recentEpisode) return `/item/${entity.id}/${entity.recentEpisode.id}`
      if (type === 'series') return `/bookshelf/series/${entity.id}`
      if (type === 'authors') return `/bookshelf/library?filter=authors.${this.$encode(entity.id)}`
      return `/item/${entity.id}`
    },
    async loadSuggestions() {
      if (!this.currentLibraryId || !this.$store.state.user.user) {
        this.suggestionShelves = []
        return
      }
      this.suggestionsLoading = true
      try {
        const categories = await this.$nativeHttp
          .get(`/api/libraries/${this.currentLibraryId}/personalized?limit=10&include=rssfeed,numEpisodesIncomplete`)
          .catch(() => null)
        if (!Array.isArray(categories)) {
          this.suggestionShelves = []
          return
        }
        this.suggestionShelves = categories
          .filter((c) => c.entities?.length)
          .slice(0, 3)
          .map((c) => ({
            id: c.id,
            label: c.label || c.id,
            type: c.type,
            entities: c.entities
          }))
      } catch (error) {
        console.error('[search] Failed to load suggestions', error)
        this.suggestionShelves = []
      } finally {
        this.suggestionsLoading = false
      }
    },
    async runSearch(value) {
      if (this.isFetching && this.lastSearch === value) return

      this.lastSearch = value
      this.$store.commit('globals/setLastSearch', value)

      if (!this.lastSearch) {
        this.isFetching = false
        this.bookResults = []
        this.podcastResults = []
        this.episodeResults = []
        this.seriesResults = []
        this.authorResults = []
        this.narratorResults = []
        this.tagResults = []
        return
      }
      if (!this.currentLibraryId) {
        this.isFetching = false
        this.bookResults = []
        this.podcastResults = []
        this.episodeResults = []
        this.seriesResults = []
        this.authorResults = []
        this.narratorResults = []
        this.tagResults = []
        return
      }
      this.isFetching = true
      const results = await this.$nativeHttp.get(`/api/libraries/${this.currentLibraryId}/search?q=${value}&limit=5`).catch((error) => {
        console.error('Search error', error)
        return null
      })
      if (value !== this.lastSearch) return
      this.isFetching = false

      this.bookResults = results?.book || []
      this.podcastResults = results?.podcast || []
      this.episodeResults = results?.episodes || []
      this.seriesResults = results?.series || []
      this.authorResults = results?.authors || []
      this.narratorResults = results?.narrators || []
      this.tagResults = results?.tags || []
    },
    updateSearch(val) {
      clearTimeout(this.searchTimeout)
      this.searchTimeout = setTimeout(() => {
        this.runSearch(val)
      }, 500)
    },
    setFocus() {
      setTimeout(() => {
        if (this.$refs.input) {
          this.$refs.input.focus()
        }
      }, 100)
    }
  },
  mounted() {
    this.loadSuggestions()
    if (this.$store.state.globals.lastSearch) {
      this.search = this.$store.state.globals.lastSearch
      this.runSearch(this.search)
    } else {
      this.$nextTick(this.setFocus())
    }
  }
}
</script>

<style>
.search-content,
.search-idle {
  height: calc(100% - 120px);
  max-height: calc(100% - 120px);
}
</style>
