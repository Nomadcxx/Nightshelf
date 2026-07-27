<template>
  <modals-modal v-model="show" width="90%">
    <section class="relative w-full overflow-hidden bg-secondary border border-border" :aria-label="sortTitle">
      <div class="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden="true" />
      <header class="min-h-14 pl-5 pr-4 flex items-center border-b border-border bg-bg">
        <p class="font-mono text-sm uppercase tracking-[0.16em] text-fg">{{ sortTitle }}</p>
      </header>
      <ul class="w-full max-h-[68vh] overflow-y-auto overscroll-contain pl-1" role="listbox" :aria-label="sortTitle">
        <template v-for="item in items">
          <li :key="item.value" :aria-selected="item.value === selected ? 'true' : 'false'" role="option">
            <button type="button" class="relative w-full min-h-12 px-4 flex items-center gap-3 border-b border-border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent" :class="item.value === selected ? 'bg-accent/10 text-accent' : 'text-fg'" @click="clickedOption(item.value)">
              <span v-if="item.value === selected" class="absolute inset-y-2 left-0 w-0.5 bg-accent" aria-hidden="true" />
              <span class="min-w-0 flex-1 truncate text-sm">{{ item.text }}</span>
              <span v-if="item.value === selected" class="flex-none font-mono text-xs uppercase tracking-wider">{{ descending ? 'Desc' : 'Asc' }}</span>
            </button>
          </li>
        </template>
      </ul>
    </section>
  </modals-modal>
</template>

<script>
export default {
  props: {
    value: Boolean,
    orderBy: String,
    descending: Boolean,
    episodes: Boolean
  },
  data() {
    return {
      bookItems: [
        {
          text: this.$strings.LabelTitle,
          value: 'media.metadata.title'
        },
        {
          text: this.$strings.LabelAuthorFirstLast,
          value: 'media.metadata.authorName'
        },
        {
          text: this.$strings.LabelAuthorLastFirst,
          value: 'media.metadata.authorNameLF'
        },
        {
          text: this.$strings.LabelPublishYear,
          value: 'media.metadata.publishedYear'
        },
        {
          text: this.$strings.LabelAddedAt,
          value: 'addedAt'
        },
        {
          text: this.$strings.LabelSize,
          value: 'size'
        },
        {
          text: this.$strings.LabelDuration,
          value: 'media.duration'
        },
        {
          text: this.$strings.LabelFileBirthtime,
          value: 'birthtimeMs'
        },
        {
          text: this.$strings.LabelFileModified,
          value: 'mtimeMs'
        },
        {
          text: this.$strings.LabelLibrarySortByProgress,
          value: 'progress'
        },
        {
          text: this.$strings.LabelLibrarySortByProgressStarted,
          value: 'progress.createdAt'
        },
        {
          text: this.$strings.LabelLibrarySortByProgressFinished,
          value: 'progress.finishedAt'
        },
        {
          text: this.$strings.LabelRandomly,
          value: 'random'
        }
      ],
      podcastItems: [
        {
          text: this.$strings.LabelTitle,
          value: 'media.metadata.title'
        },
        {
          text: this.$strings.LabelAuthor,
          value: 'media.metadata.author'
        },
        {
          text: this.$strings.LabelAddedAt,
          value: 'addedAt'
        },
        {
          text: this.$strings.LabelSize,
          value: 'size'
        },
        {
          text: this.$strings.LabelNumberOfEpisodes,
          value: 'media.numTracks'
        },
        {
          text: this.$strings.LabelFileBirthtime,
          value: 'birthtimeMs'
        },
        {
          text: this.$strings.LabelFileModified,
          value: 'mtimeMs'
        },
        {
          text: this.$strings.LabelRandomly,
          value: 'random'
        }
      ],
      episodeItems: [
        {
          text: this.$strings.LabelPubDate,
          value: 'publishedAt'
        },
        {
          text: this.$strings.LabelTitle,
          value: 'title'
        },
        {
          text: this.$strings.LabelSeason,
          value: 'season'
        },
        {
          text: this.$strings.LabelEpisode,
          value: 'episode'
        },
        {
          text: this.$strings.LabelFilename,
          value: 'audioFile.metadata.filename'
        }
      ]
    }
  },
  computed: {
    show: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    selected: {
      get() {
        return this.orderBy
      },
      set(val) {
        this.$emit('update:orderBy', val)
      }
    },
    selectedDesc: {
      get() {
        return this.descending
      },
      set(val) {
        this.$emit('update:descending', val)
      }
    },
    isPodcast() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType'] === 'podcast'
    },
    sortTitle() {
      return this.episodes ? this.$strings.HeaderSortItems : this.$strings.HeaderSortLibrary
    },
    items() {
      if (this.episodes) return this.episodeItems
      if (this.isPodcast) return this.podcastItems
      return this.bookItems
    }
  },
  methods: {
    async clickedOption(val) {
      await this.$hapticsSelectionChange()
      if (this.selected === val) {
        this.selectedDesc = !this.selectedDesc
      } else {
        if (val === 'recent' || val === 'addedAt') this.selectedDesc = true // Progress defaults to descending
        this.selected = val
      }
      this.show = false
      this.$nextTick(() => this.$emit('change', val))
    }
  },
  mounted() {}
}
</script>
