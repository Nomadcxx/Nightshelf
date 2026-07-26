<template>
  <div
    ref="card"
    class="flex h-full px-1 overflow-hidden"
    :class="{ 'is-pressed': isPressed }"
    @click="onCardClick"
    @pointerdown="onPressPointerDown"
    @pointermove="onPressPointerMove"
    @pointerup="onPressPointerUp"
    @pointercancel="onPressPointerCancel"
    @lostpointercapture="onPressLostCapture"
    @contextmenu="onPressContextMenu"
    @keydown="onPressKeydown"
  >
    <covers-book-cover :library-item="libraryItem" :width="coverWidth" :book-cover-aspect-ratio="bookCoverAspectRatio" />
    <div class="grow px-2 audiobookSearchCardContent">
      <p class="truncate text-sm text-fg">{{ title }}</p>
      <p v-if="subtitle" class="truncate font-mono text-xxs uppercase tracking-wide text-fg-muted">{{ subtitle }}</p>
      <p class="font-mono text-xxs uppercase tracking-wide text-fg-muted truncate">{{ $getString('LabelByAuthor', [authorName]) }}</p>
    </div>
  </div>
</template>

<script>
import libraryPressInteraction from '@/mixins/libraryPressInteraction'
import shelfEntityPeek from '@/mixins/shelfEntityPeek'

export default {
  mixins: [libraryPressInteraction, shelfEntityPeek],
  props: {
    libraryItem: {
      type: Object,
      default: () => {}
    },
    search: String
  },
  computed: {
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio']
    },
    coverWidth() {
      if (this.bookCoverAspectRatio === 1) return 50 * 1.2
      return 50
    },
    media() {
      return this.libraryItem ? this.libraryItem.media || {} : {}
    },
    mediaMetadata() {
      return this.media.metadata || {}
    },
    mediaType() {
      return this.libraryItem ? this.libraryItem.mediaType : null
    },
    isPodcast() {
      return this.mediaType === 'podcast'
    },
    title() {
      return this.mediaMetadata.title || 'No Title'
    },
    subtitle() {
      return this.mediaMetadata.subtitle
    },
    authorName() {
      if (this.isPodcast) return this.mediaMetadata.author
      return this.mediaMetadata.authorName
    }
  },
  methods: {
    peekSource() {
      return { libraryItem: this.libraryItem }
    },
    onCardClick(e) {
      // Search results sit inside a nuxt-link. This handler runs before the
      // link's, so stopping here is what prevents a committed hold from also
      // navigating.
      if (this.onPressClick()) {
        e.stopPropagation()
        e.preventDefault()
      }
    }
  }
}
</script>

<style>
.audiobookSearchCardContent {
  width: calc(100% - 80px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>

<style scoped>
.is-pressed {
  opacity: 0.65;
}
</style>
