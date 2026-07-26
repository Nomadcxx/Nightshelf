<template>
  <div class="w-full relative cover-rail" :class="{ 'cover-rail--glass': showGlass }" :style="glassStyle">
    <!--
      The wash is the rail's own leading artwork, blurred past recognition. It
      exists so the glass above it has something to refract; backdrop-filter over
      a flat canvas costs GPU and shows nothing.
    -->
    <div v-if="showGlass" class="cover-rail__wash" aria-hidden="true" />
    <div v-if="showGlass" class="cover-rail__glass" aria-hidden="true" />

    <div class="cover-rail__head flex items-center justify-between gap-3">
      <p class="font-mono text-xs uppercase tracking-[0.18em] text-fg">{{ label }}</p>
      <button type="button" class="min-h-[44px] px-2 flex items-center font-mono text-[0.65rem] uppercase tracking-widest text-mint-accent" @click="seeAll">{{ $strings.ButtonBrowseAll }}</button>
    </div>

    <div class="rail-strip flex max-w-full overflow-x-auto scrollbar-hide">
      <template v-for="(entity, index) in entities">
        <cards-lazy-book-card
          v-if="type === 'book' || type === 'podcast'"
          :key="entity.id"
          :index="index"
          :book-mount="entity"
          :width="bookWidth"
          :height="entityHeight"
          :book-cover-aspect-ratio="bookCoverAspectRatio"
          :is-alt-view-enabled="true"
          class="relative flex-none cover-rail-card"
        />
        <cards-lazy-book-card
          v-if="type === 'episode'"
          :key="entity.recentEpisode.id"
          :index="index"
          :book-mount="entity"
          :width="bookWidth"
          :height="entityHeight"
          :book-cover-aspect-ratio="bookCoverAspectRatio"
          :is-alt-view-enabled="true"
          class="relative flex-none cover-rail-card"
        />
        <cards-lazy-series-card
          v-else-if="type === 'series'"
          :key="entity.id"
          :index="index"
          :series-mount="entity"
          :width="bookWidth * 2"
          :height="entityHeight"
          :book-cover-aspect-ratio="bookCoverAspectRatio"
          :is-alt-view-enabled="true"
          is-categorized
          class="relative flex-none cover-rail-card"
        />
        <cards-author-card
          v-else-if="type === 'authors'"
          :key="entity.id"
          :width="bookWidth / 1.25"
          :height="bookWidth"
          :author="entity"
          :size-multiplier="1"
          class="flex-none cover-rail-card"
        />
      </template>
      <!-- trailing spacer so the last card clears the page gutter -->
      <div class="rail-tail flex-none h-1" aria-hidden="true" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    label: String,
    type: String,
    entities: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    /**
     * Cover of the rail's first entity, used as the wash behind the glass.
     * Falls back to no glass rather than a flat tinted band when the rail has
     * nothing to sample — an empty rail has no depth to express.
     */
    washUrl() {
      const first = this.entities?.[0]
      if (!first) return null
      const item = first.libraryItem || first
      const id = item?.id
      if (!id) return null
      return this.store.getters['globals/getLibraryItemCoverSrc'](item, null, false)
    },
    showGlass() {
      // Reduced motion keeps the glass — it is depth, not movement — but the
      // rail drops it when there is nothing to sample.
      return !!this.washUrl
    },
    glassStyle() {
      if (!this.washUrl) return null
      return { '--rail-wash': `url("${this.washUrl}")` }
    },
    store() {
      return this.$store || this.$nuxt.$store
    },
    bookWidth() {
      // Sized so three covers plus a peek of the fourth fit a phone width. The
      // previous 128 (204 on square-ratio libraries) fit exactly two, which is
      // what made the shelf read sparse.
      const coverSize = 65
      if (this.isCoverSquareAspectRatio) return coverSize * 1.6
      return coverSize
    },
    bookHeight() {
      if (this.isCoverSquareAspectRatio) return this.bookWidth
      return this.bookWidth * 1.6
    },
    entityHeight() {
      return this.bookHeight
    },
    isCoverSquareAspectRatio() {
      return this.bookCoverAspectRatio === 1
    },
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio']
    }
  },
  methods: {
    seeAll() {
      // Dense hunt mode for the full library
      this.$store.commit('globals/setLibraryViewMode', 'grid')
      this.$localStore?.setLibraryViewMode?.('grid')
      if (this.$route.name !== 'bookshelf-library') {
        this.$router.push('/bookshelf/library')
      }
    }
  }
}
</script>

<style scoped>
.cover-rail {
  padding: 12px 0 13px;
  margin-bottom: 10px;
  isolation: isolate;
}

/* Blurred artwork wash — the thing the glass refracts. */
.cover-rail__wash {
  position: absolute;
  inset: 0;
  z-index: -2;
  background: var(--rail-wash) center / cover no-repeat;
  filter: blur(34px) saturate(160%);
  opacity: 0.42;
  pointer-events: none;
}

.cover-rail__glass {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgb(18 20 31 / 0.72);
  backdrop-filter: blur(var(--glass-shelf-blur)) saturate(var(--glass-shelf-saturate));
  -webkit-backdrop-filter: blur(var(--glass-shelf-blur)) saturate(var(--glass-shelf-saturate));
  border-top: 1px solid rgb(var(--color-fg) / 0.08);
  border-bottom: 1px solid rgb(var(--color-fg) / 0.08);
  pointer-events: none;
}

.cover-rail__head {
  padding: 0 var(--shelf-edge) 7px;
}

.rail-strip {
  gap: var(--shelf-gap);
  /*
   * The title and author block hangs below each cover, and `overflow-x: auto`
   * forces `overflow-y: auto` — so without reserved room here the titles are
   * clipped by the scroll container rather than shown. The value tracks
   * LazyBookCard's titleDisplayBottomOffset plus two lines of text.
   */
  padding: 0 0 58px var(--shelf-edge);
  align-items: flex-start;
}

.rail-tail {
  width: var(--shelf-edge);
}

.text-mint-accent {
  color: rgb(var(--color-success));
}

/*
 * No border-radius here. A scoped selector outranks .ns-cover-surface, so a
 * value set at this level silently defeats --radius-cover and every shelf cover
 * renders square. The corner belongs to the token.
 */

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
