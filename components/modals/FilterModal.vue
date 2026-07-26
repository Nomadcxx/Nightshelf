<template>
  <modals-modal v-model="show" width="90%" height="100%">
    <div class="w-full h-full overflow-hidden absolute top-0 left-0 flex items-center justify-center" @click="show = false">
      <section class="relative w-full overflow-hidden bg-secondary border border-border mt-8" style="max-height: 76%" :aria-label="$strings.HeaderFilterLibrary" @click.stop>
        <div class="absolute inset-y-0 left-0 w-1 bg-success" aria-hidden="true" />
        <header class="min-h-14 pl-5 pr-3 flex items-center gap-3 border-b border-border bg-bg">
          <p class="font-mono text-sm uppercase tracking-[0.16em] text-fg">{{ $strings.HeaderFilterLibrary }}</p>
          <div class="flex-grow" />
          <button v-if="selected !== 'all'" type="button" class="min-h-12 px-3 font-mono text-xs uppercase tracking-wider text-success focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" @click="clearSelected">
            {{ $strings.ButtonClearFilter }}
          </button>
        </header>

        <ul v-show="!sublist" class="w-full max-h-[64vh] overflow-y-auto overscroll-contain pl-1" role="listbox" :aria-label="$strings.HeaderFilterLibrary">
          <template v-for="item in items">
            <li :key="item.value" :aria-selected="isItemSelected(item) ? 'true' : 'false'" role="option">
              <button type="button" class="relative w-full min-h-12 px-4 flex items-center gap-3 border-b border-border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent" :class="isItemSelected(item) ? 'bg-success/10 text-success' : 'text-fg'" @click="clickedOption(item)">
                <span v-if="isItemSelected(item)" class="absolute inset-y-2 left-0 w-0.5 bg-success" aria-hidden="true" />
                <span class="min-w-0 flex-1 truncate font-mono text-xs uppercase tracking-[0.12em]">{{ item.text }}</span>
                <ui-ph-icon v-if="item.sublist" name="arrow_forward" :size="20" class="flex-none text-fg-muted" />
                <ui-ph-icon v-else-if="isItemSelected(item)" name="check" :size="20" class="flex-none" />
              </button>
            </li>
          </template>
        </ul>

        <ul v-show="sublist" class="w-full max-h-[64vh] overflow-y-auto overscroll-contain pl-1" role="listbox" :aria-label="sublist">
          <li role="option">
            <button type="button" class="w-full min-h-12 px-4 flex items-center gap-3 border-b border-border text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent" @click="sublist = null">
              <ui-ph-icon name="arrow_back" :size="20" class="flex-none text-success" />
              <span class="font-mono text-xs uppercase tracking-[0.12em]">{{ $strings.ButtonBack }}</span>
            </button>
          </li>
          <li v-if="!sublistItems.length" class="min-h-16 px-4 flex items-center font-mono text-xs uppercase tracking-wider text-fg-muted" role="option">
            No {{ sublist }} items
          </li>
          <template v-for="item in sublistItems">
            <li :key="item.value" :aria-selected="`${sublist}.${item.value}` === selected ? 'true' : 'false'" role="option">
              <button type="button" class="relative w-full min-h-12 px-4 flex items-center gap-3 border-b border-border text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent" :class="`${sublist}.${item.value}` === selected ? 'bg-success/10 text-success' : 'text-fg'" @click="clickedSublistOption(item.value)">
                <span v-if="`${sublist}.${item.value}` === selected" class="absolute inset-y-2 left-0 w-0.5 bg-success" aria-hidden="true" />
                <span class="min-w-0 flex-1 truncate text-sm">{{ item.text }}</span>
                <ui-ph-icon v-if="`${sublist}.${item.value}` === selected" name="check" :size="20" class="flex-none" />
              </button>
            </li>
          </template>
        </ul>
      </section>
    </div>
  </modals-modal>
</template>

<script>
export default {
  props: {
    value: Boolean,
    filterBy: String
  },
  data() {
    return {
      sublist: null
    }
  },
  watch: {
    show(newVal) {
      if (!newVal) {
        if (this.sublist && !this.selectedItemSublist) this.sublist = null
        if (!this.sublist && this.selectedItemSublist) this.sublist = this.selectedItemSublist
      }
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
        return this.filterBy
      },
      set(val) {
        this.$emit('update:filterBy', val)
      }
    },
    userCanAccessExplicitContent() {
      return this.$store.getters['user/getUserCanAccessExplicitContent']
    },
    bookItems() {
      const items = [
        {
          text: this.$strings.LabelAll,
          value: 'all'
        },
        {
          text: this.$strings.LabelGenre,
          value: 'genres',
          sublist: true
        },
        {
          text: this.$strings.LabelTag,
          value: 'tags',
          sublist: true
        },
        {
          text: this.$strings.LabelSeries,
          value: 'series',
          sublist: true
        },
        {
          text: this.$strings.LabelAuthor,
          value: 'authors',
          sublist: true
        },
        {
          text: this.$strings.LabelNarrator,
          value: 'narrators',
          sublist: true
        },
        {
          text: this.$strings.LabelLanguage,
          value: 'languages',
          sublist: true
        },
        {
          text: this.$strings.LabelProgress,
          value: 'progress',
          sublist: true
        },
        {
          text: this.$strings.LabelEbooks,
          value: 'ebooks',
          sublist: true
        },
        {
          text: this.$strings.ButtonIssues,
          value: 'issues',
          sublist: false
        },
        {
          text: this.$strings.LabelRSSFeedOpen,
          value: 'feed-open',
          sublist: false
        }
      ]

      if (this.userCanAccessExplicitContent) {
        items.push({
          text: this.$strings.LabelExplicit,
          value: 'explicit',
          sublist: false
        })
      }

      return items
    },
    podcastItems() {
      const items = [
        {
          text: this.$strings.LabelAll,
          value: 'all'
        },
        {
          text: this.$strings.LabelGenre,
          value: 'genres',
          sublist: true
        },
        {
          text: this.$strings.LabelTag,
          value: 'tags',
          sublist: true
        },
        {
          text: this.$strings.LabelRSSFeedOpen,
          value: 'feed-open',
          sublist: false
        }
      ]

      if (this.userCanAccessExplicitContent) {
        items.push({
          text: this.$strings.LabelExplicit,
          value: 'explicit',
          sublist: false
        })
      }

      return items
    },
    isPodcast() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType'] === 'podcast'
    },
    items() {
      if (this.isPodcast) return this.podcastItems
      return this.bookItems
    },
    selectedItemSublist() {
      return this.selected && this.selected.includes('.') ? this.selected.split('.')[0] : false
    },
    genres() {
      return this.filterData.genres || []
    },
    tags() {
      return this.filterData.tags || []
    },
    series() {
      return this.filterData.series || []
    },
    authors() {
      return this.filterData.authors || []
    },
    narrators() {
      return this.filterData.narrators || []
    },
    languages() {
      return this.filterData.languages || []
    },
    progress() {
      return [
        {
          id: 'finished',
          name: this.$strings.LabelFinished
        },
        {
          id: 'in-progress',
          name: this.$strings.LabelInProgress
        },
        {
          id: 'not-started',
          name: this.$strings.LabelNotStarted
        },
        {
          id: 'not-finished',
          name: this.$strings.LabelNotFinished
        }
      ]
    },
    ebooks() {
      return [
        {
          id: 'ebook',
          name: this.$strings.LabelHasEbook
        },
        {
          id: 'supplementary',
          name: this.$strings.LabelHasSupplementaryEbook
        }
      ]
    },
    sublistItems() {
      const sublistItems = (this[this.sublist] || []).map((item) => {
        if (typeof item === 'string') {
          return {
            text: item,
            value: this.$encode(item)
          }
        } else {
          return {
            text: item.name,
            value: this.$encode(item.id)
          }
        }
      })
      if (this.sublist === 'series') {
        sublistItems.unshift({
          text: this.$strings.MessageNoSeries,
          value: this.$encode('no-series')
        })
      }
      return sublistItems
    },
    filterData() {
      return this.$store.state.libraries.filterData || {}
    }
  },
  methods: {
    isItemSelected(item) {
      return item.value === this.selected || (item.sublist && this.selected?.startsWith(`${item.value}.`))
    },
    async clearSelected() {
      await this.$hapticsImpact()
      this.selected = 'all'
      this.show = false
      this.$nextTick(() => this.$emit('change', 'all'))
    },
    clickedSublistOption(item) {
      this.clickedOption({ value: `${this.sublist}.${item}` })
    },
    async clickedOption(option) {
      if (option.sublist) {
        this.sublist = option.value
        return
      }

      var val = option.value
      if (this.selected === val) {
        this.show = false
        return
      }
      await this.$hapticsImpact()
      this.selected = val
      this.show = false
      this.$nextTick(() => this.$emit('change', val))
    }
  },
  mounted() {}
}
</script>

<style>
.filter-modal-wrapper {
  max-height: calc(100% - 320px);
}
</style>
