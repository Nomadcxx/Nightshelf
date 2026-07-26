<template>
  <covers-library-cover-surface
    :src="fullCoverUrl"
    :placeholder-src="placeholderUrl"
    :width="width"
    :height="height"
    :cover-aspect-ratio="bookCoverAspectRatio"
    :title="title"
    :subtitle="author"
    :has-cover="hasCover"
    :no-fill="noBg"
    :flat="flat"
    :object-fit="noBg ? 'contain' : 'fill'"
    @image-loaded="onImageLoaded"
  />
</template>

<script>
import { Capacitor } from '@capacitor/core'

/**
 * Book artwork wherever a card is not doing its own layout — search results,
 * detail pages, group covers.
 *
 * This resolves *which* image to show; LibraryCoverSurface decides how it is
 * presented. Keeping those separate is what stops the aspect-ratio fill rule
 * and the decode fade from being reimplemented per call site.
 */
export default {
  props: {
    libraryItem: {
      type: Object,
      default: () => {}
    },
    width: {
      type: Number,
      default: 120
    },
    bookCoverAspectRatio: Number,
    downloadCover: String,
    raw: Boolean,
    noBg: Boolean,
    /** Set when this cover is one tile of a composite series/collection cover. */
    flat: Boolean
  },
  computed: {
    isLocal() {
      if (!this.libraryItem) return false
      return this.libraryItem.isLocal
    },
    localCover() {
      return this.libraryItem?.coverContentUrl || null
    },
    height() {
      return this.width * this.bookCoverAspectRatio
    },
    media() {
      if (!this.libraryItem) return {}
      return this.libraryItem.media || {}
    },
    mediaMetadata() {
      return this.media.metadata || {}
    },
    title() {
      return this.mediaMetadata.title || 'No Title'
    },
    authors() {
      return this.mediaMetadata.authors || []
    },
    author() {
      return this.authors.map((au) => au.name).join(', ')
    },
    placeholderUrl() {
      return '/book_placeholder_nightshelf.svg'
    },
    fullCoverUrl() {
      if (this.isLocal) {
        if (this.localCover) return Capacitor.convertFileSrc(this.localCover)
        return this.placeholderUrl
      }
      if (this.downloadCover) return this.downloadCover
      if (!this.libraryItem) return null
      const store = this.$store || this.$nuxt.$store
      return store.getters['globals/getLibraryItemCoverSrc'](this.libraryItem, this.placeholderUrl, this.raw)
    },
    hasCover() {
      return (!!this.media.coverPath && !this.isLocal) || !!this.localCover || !!this.downloadCover
    }
  },
  methods: {
    onImageLoaded(src) {
      this.$emit('imageLoaded', src)
    }
  }
}
</script>
