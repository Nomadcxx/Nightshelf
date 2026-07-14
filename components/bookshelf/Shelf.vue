<template>
  <div class="w-full relative cover-rail py-4">
    <div class="px-4 pb-3 flex items-center justify-between gap-3">
      <p class="font-mono text-xs uppercase tracking-[0.18em] text-fg">{{ label }}</p>
      <button type="button" class="font-mono text-xxs uppercase tracking-widest text-accent" @click="seeAll">See all</button>
    </div>

    <div class="flex items-end pl-4 max-w-full overflow-x-auto gap-3 pb-2 scrollbar-hide">
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
      <!-- peek spacer so last card isn't flush -->
      <div class="flex-none w-4 h-1" aria-hidden="true" />
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
    bookWidth() {
      // Larger Netflix-style covers
      var coverSize = 128
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
.cover-rail-card {
  /* Border lives on .rail-item inside LazyBookCard */
  border-radius: 2px;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
