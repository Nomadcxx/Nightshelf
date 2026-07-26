<template>
  <div
    ref="card"
    :id="`playlist-card-${index}`"
    :style="{ width: width + 'px', height: height + 'px' }"
    class="ns-cover-surface absolute top-0 left-0 z-30 cursor-pointer"
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
      <covers-playlist-cover ref="cover" :items="items" :width="width" :height="height" />
    </div>
    <div class="categoryPlacard absolute z-30 left-0 right-0 mx-auto -bottom-6 h-6 rounded-md text-center" :style="{ width: Math.min(160, width) + 'px' }">
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
    playlistMount: {
      type: Object,
      default: () => null
    },
    isAltViewEnabled: Boolean
  },
  data() {
    return {
      playlist: null,
      isSelectionMode: false
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
      return this.playlist ? this.playlist.name : ''
    },
    items() {
      return this.playlist ? this.playlist.items || [] : []
    },
    store() {
      return this.$store || this.$nuxt.$store
    },
    currentLibraryId() {
      return this.store.state.libraries.currentLibraryId
    }
  },
  methods: {
    setEntity(playlist) {
      this.playlist = playlist
    },
    setSelectionMode(val) {
      this.isSelectionMode = val
    },
    peekSource() {
      if (!this.playlist) return null
      return { entityType: 'playlist', playlist: this.playlist }
    },
    clickCard(e) {
      if (this.onPressClick()) {
        if (e) {
          e.stopPropagation()
          e.preventDefault()
        }
        return
      }
      if (!this.playlist) return
      var router = this.$router || this.$nuxt.$router
      router.push(`/playlist/${this.playlist.id}`)
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
    if (this.playlistMount) {
      this.setEntity(this.playlistMount)
    }
  }
}
</script>