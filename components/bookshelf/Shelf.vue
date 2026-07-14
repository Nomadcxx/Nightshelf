<template>
  <div class="w-full relative cover-rail py-3">
    <div class="px-4 pb-2 flex items-end justify-between gap-3">
      <p class="font-mono text-xxs uppercase tracking-widest text-fg-muted">{{ label }}</p>
    </div>

    <div class="flex items-end px-3 max-w-full overflow-x-auto gap-1 pb-1">
      <template v-for="(entity, index) in entities">
        <cards-lazy-book-card v-if="type === 'book' || type === 'podcast'" :key="entity.id" :index="index" :book-mount="entity" :width="bookWidth" :height="entityHeight" :book-cover-aspect-ratio="bookCoverAspectRatio" :is-alt-view-enabled="true" class="mx-1.5 relative flex-none" />
        <cards-lazy-book-card v-if="type === 'episode'" :key="entity.recentEpisode.id" :index="index" :book-mount="entity" :width="bookWidth" :height="entityHeight" :book-cover-aspect-ratio="bookCoverAspectRatio" :is-alt-view-enabled="true" class="mx-1.5 relative flex-none" />
        <cards-lazy-series-card v-else-if="type === 'series'" :key="entity.id" :index="index" :series-mount="entity" :width="bookWidth * 2" :height="entityHeight" :book-cover-aspect-ratio="bookCoverAspectRatio" :is-alt-view-enabled="true" is-categorized class="mx-1.5 relative flex-none" />
        <cards-author-card v-else-if="type === 'authors'" :key="entity.id" :width="bookWidth / 1.25" :height="bookWidth" :author="entity" :size-multiplier="1" class="mx-1.5 flex-none" />
      </template>
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
      var coverSize = 108
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
  }
}
</script>
