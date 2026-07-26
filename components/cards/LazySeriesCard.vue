<template>
  <div
    ref="card"
    :id="`series-card-${index}`"
    :style="{ width: width + 'px', height: height + 'px' }"
    class="ns-cover-surface cursor-pointer z-30"
    :class="[isPressed ? 'is-pressed' : '', isPressPending || isPressed ? 'is-active' : '']"
    @click="clickCard"
    @pointerdown="onPressPointerDown"
    @pointermove="onPressPointerMove"
    @pointerup="onPressPointerUp"
    @pointercancel="onPressPointerCancel"
    @lostpointercapture="onPressLostCapture"
    role="button"
    :aria-label="shelfCardLabel"
    tabindex="0"
    @contextmenu="onPressContextMenu"
    @keydown="onPressKeydown"
  >
    <div class="w-full h-full bg-primary relative overflow-hidden" style="border-radius: inherit">
      <covers-group-cover v-if="series" ref="cover" :id="seriesId" :name="title" :book-items="books" :width="width" :height="height" :book-cover-aspect-ratio="bookCoverAspectRatio" />
    </div>

    <div v-if="seriesPercentInProgress > 0" class="absolute bottom-0 left-0 h-1 w-full max-w-full z-10 rounded-b overflow-hidden bg-track">
      <div class="h-full box-shadow-progressbar" :class="isSeriesFinished ? 'bg-success' : 'bg-accent'" :style="{ width: seriesPercentInProgress * 100 + '%' }" />
    </div>

    <div v-if="isAltViewEnabled && isCategorized" class="absolute z-30 left-0 right-0 mx-auto -bottom-8 h-8 py-1 rounded-md text-center">
      <p class="truncate" :style="{ fontSize: labelFontSize + 'rem' }">{{ title }}</p>
    </div>
    <div v-if="!isCategorized" class="categoryPlacard absolute z-30 left-0 right-0 mx-auto -bottom-6 h-6 rounded-md text-center" :style="{ width: Math.min(240, width) + 'px' }">
      <div class="w-full h-full flex items-center justify-center rounded-sm border" :class="isAltViewEnabled ? 'altBookshelfLabel' : 'shinyBlack'" :style="{ padding: `0rem ${0.5 * sizeMultiplier}rem` }">
        <p class="truncate" :style="{ fontSize: labelFontSize + 'rem' }">{{ title }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import libraryPressInteraction from '@/mixins/libraryPressInteraction'
import shelfEntityPeek from '@/mixins/shelfEntityPeek'

export default {
  mixins: [libraryPressInteraction, shelfEntityPeek],
  props: {
    index: Number,
    width: Number,
    height: Number,
    bookCoverAspectRatio: Number,
    seriesMount: {
      type: Object,
      default: () => null
    },
    isAltViewEnabled: Boolean,
    isCategorized: Boolean
  },
  data() {
    return {
      series: null,
      isSelectionMode: false,
      selected: false,
      imageReady: false
    }
  },
  computed: {
    labelFontSize() {
      if (this.width < 160) return 0.75
      return 0.875
    },
    sizeMultiplier() {
      if (this.bookCoverAspectRatio === 1) return this.width / (120 * 1.6 * 2)
      return this.width / 240
    },
    title() {
      return this.series ? this.series.name : ''
    },
    books() {
      return this.series ? this.series.books || [] : []
    },
    seriesBookProgress() {
      return this.books
        .map((libraryItem) => {
          return this.store.getters['user/getUserMediaProgress'](libraryItem.id)
        })
        .filter((p) => !!p)
    },
    seriesBooksFinished() {
      return this.seriesBookProgress.filter((p) => p.isFinished)
    },
    hasSeriesBookInProgress() {
      return this.seriesBookProgress.some((p) => !p.isFinished && p.progress > 0)
    },
    seriesPercentInProgress() {
      let totalFinishedAndInProgress = this.seriesBooksFinished.length
      if (this.hasSeriesBookInProgress) totalFinishedAndInProgress += 1
      return Math.min(1, Math.max(0, totalFinishedAndInProgress / this.books.length))
    },
    isSeriesFinished() {
      return this.books.length === this.seriesBooksFinished.length
    },
    store() {
      return this.$store || this.$nuxt.$store
    },
    currentLibraryId() {
      return this.store.state.libraries.currentLibraryId
    },
    seriesId() {
      return this.series ? this.series.id : null
    }
  },
  methods: {
    setEntity(_series) {
      this.series = _series
    },
    setSelectionMode(val) {
      this.isSelectionMode = val
    },
    peekSource() {
      if (!this.series) return null
      return { entityType: 'series', series: this.series, progress: this.seriesPercentInProgress, isFinished: this.isSeriesFinished }
    },
    peekContext() {
      return { canSelect: false }
    },
    clickCard(e) {
      if (this.onPressClick()) {
        if (e) {
          e.stopPropagation()
          e.preventDefault()
        }
        return
      }
      if (!this.series) return
      var router = this.$router || this.$nuxt.$router
      router.push(`/bookshelf/series/${this.seriesId}`)
    },
    imageLoaded() {
      this.imageReady = true
    },
    destroy() {
      // destroy the vue listeners, etc
      this.$destroy()

      // remove the element from the DOM
      if (this.$el && this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el)
      } else if (this.$el && this.$el.remove) {
        this.$el.remove()
      }
    }
  },
  mounted() {
    if (this.seriesMount) {
      this.setEntity(this.seriesMount)
    }
  },
  beforeDestroy() {}
}
</script>
