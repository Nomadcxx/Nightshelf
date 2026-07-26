<template>
  <div class="ns-cover-root relative" :style="rootStyle">
    <!-- The artwork. This is the only element that clips, and it carries no
         border — the shadow and the radius are what separate it from the shelf. -->
    <div ref="surface" class="ns-cover-art absolute inset-0" :class="surfaceClasses" :style="surfaceStyle">
      <!-- Blurred fill shown only when the artwork's aspect ratio disagrees
           with the library's, so letterboxing never shows bare background. -->
      <div v-show="showCoverBg" class="ns-cover-fill absolute inset-0 overflow-hidden">
        <div ref="coverBg" class="absolute cover-bg" />
      </div>

      <!-- Title shown while the artwork is still decoding, so a scrolling
           shelf is never a grid of blank rectangles. -->
      <div v-if="!imageReady && showLoadingTitle" class="absolute inset-0 flex items-center justify-center" :style="{ padding: 0.5 * sizeMultiplier + 'rem' }">
        <p class="text-fg-muted text-center leading-tight" :style="{ fontSize: 0.8 * sizeMultiplier + 'rem' }">{{ title }}</p>
      </div>

      <img
        v-if="resolvedSrc"
        ref="image"
        :src="resolvedSrc"
        :alt="title"
        loading="lazy"
        decoding="async"
        class="ns-image-fade absolute inset-0 w-full h-full"
        :class="[imageDecoded ? 'is-decoded' : '', showCoverBg ? 'object-contain' : objectFitClass]"
        @load="onImageLoad"
        @error="onImageError"
      />

      <!-- Generated cover for items the server has no artwork for. -->
      <template v-if="!hasArtwork">
        <div class="absolute inset-0 flex items-center justify-center" :style="{ padding: placeholderPadding + 'rem' }">
          <p class="ns-cover-placeholder-title text-center leading-none" :style="{ fontSize: 0.8 * sizeMultiplier + 'rem' }">{{ titleCleaned }}</p>
        </div>
        <div v-if="subtitleCleaned" class="absolute left-0 right-0 flex items-center justify-center" :style="{ padding: placeholderPadding + 'rem', bottom: 0.75 * sizeMultiplier + 'rem' }">
          <p class="ns-cover-placeholder-subtitle text-center leading-none" :style="{ fontSize: 0.6 * sizeMultiplier + 'rem' }">{{ subtitleCleaned }}</p>
        </div>
      </template>

      <!-- Anything that must be clipped to the artwork's rounded corners. -->
      <slot name="artwork-overlay" />
    </div>

    <!--
      Badges, progress and controls are siblings of the artwork, never children.
      Nesting them inside the clipped surface is what produced the card-within-a-card
      framing; as siblings they share the press transform without inheriting the clip.
    -->
    <slot />
  </div>
</template>

<script>
/**
 * The single cover presentation used by every library card.
 *
 * It owns artwork loading, the aspect-ratio fill decision, the decode fade and
 * the placeholder. Cards supply an already-resolved URL and describe the item;
 * they do not repeat this logic. Press state is passed in rather than sensed
 * here, because the gesture belongs to the card that owns the interaction.
 */
export default {
  props: {
    src: String,
    placeholderSrc: {
      type: String,
      default: '/book_placeholder_nightshelf.svg'
    },
    width: {
      type: Number,
      default: 120
    },
    height: {
      type: Number,
      default: 192
    },
    /** Library's configured cover aspect ratio as height / width. */
    coverAspectRatio: {
      type: Number,
      default: 1.6
    },
    title: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    /** False when the server has no artwork and the placeholder should render. */
    hasCover: Boolean,
    pressed: Boolean,
    /** True from first touch until the gesture resolves — gates will-change. */
    active: Boolean,
    selected: Boolean,
    /** Disables the blurred fill; used where the cover is drawn edge to edge. */
    noFill: Boolean,
    /** Renders as a bare tile: no radius, no shadow, no press affordance. */
    flat: Boolean,
    showLoadingTitle: {
      type: Boolean,
      default: true
    },
    objectFit: {
      type: String,
      default: 'fill'
    }
  },
  data() {
    return {
      imageReady: false,
      imageDecoded: false,
      imageFailed: false,
      showCoverBg: false
    }
  },
  watch: {
    src() {
      // A recycled card pointed at a new item must not show the previous
      // artwork's fill decision while the new image decodes.
      this.imageReady = false
      this.imageDecoded = false
      this.imageFailed = false
      this.showCoverBg = false
    }
  },
  computed: {
    resolvedSrc() {
      if (this.imageFailed) return this.placeholderSrc
      return this.src || this.placeholderSrc
    },
    hasArtwork() {
      return this.hasCover && !this.imageFailed
    },
    rootStyle() {
      return {
        width: this.width + 'px',
        minWidth: this.width + 'px',
        maxWidth: this.width + 'px',
        height: this.height + 'px'
      }
    },
    surfaceClasses() {
      return {
        // A tile inside a composite cover gets no radius and no shadow of its
        // own — two shadowed, rounded covers butted together read as cards
        // floating inside a card, which is the framing we are removing.
        'ns-cover-surface': !this.flat,
        'ns-cover-flat': this.flat,
        'is-pressed': this.pressed,
        'is-active': this.active,
        'is-selected': this.selected
      }
    },
    surfaceStyle() {
      if (this.flat) return {}
      return { borderRadius: this.coverRadius }
    },
    coverRadius() {
      // Small covers need a proportionally smaller radius or they read as pills.
      return this.width < 96 ? '10px' : 'var(--radius-cover)'
    },
    objectFitClass() {
      if (this.objectFit === 'cover') return 'object-cover'
      if (this.objectFit === 'contain') return 'object-contain'
      return 'object-fill'
    },
    sizeMultiplier() {
      const baseSize = this.coverAspectRatio === 1 ? 192 : 120
      return this.width / baseSize
    },
    placeholderPadding() {
      return this.sizeMultiplier < 0.5 ? 0 : this.sizeMultiplier
    },
    titleCleaned() {
      if (this.title.length > 60) return this.title.slice(0, 57) + '...'
      return this.title
    },
    subtitleCleaned() {
      if (this.subtitle.length > 30) return this.subtitle.slice(0, 27) + '...'
      return this.subtitle
    }
  },
  methods: {
    onImageLoad() {
      this.imageReady = true
      // Let the element paint at opacity 0 before the class flips, otherwise
      // the browser has nothing to transition from and the fade is skipped.
      this.$nextTick(() => {
        this.imageDecoded = true
      })

      this.evaluateCoverFill()
      this.$emit('image-loaded', this.resolvedSrc)
    },
    evaluateCoverFill() {
      if (this.noFill || !this.hasArtwork) {
        this.showCoverBg = false
        return
      }
      const img = this.$refs.image
      if (!img || !img.naturalWidth) return

      const aspectRatio = img.naturalHeight / img.naturalWidth
      // Stretch artwork that is close to the library ratio; blur-fill behind
      // anything far enough off that stretching would visibly distort it.
      if (Math.abs(aspectRatio - this.coverAspectRatio) > 0.15) {
        this.showCoverBg = true
        this.$nextTick(this.applyCoverBg)
      } else {
        this.showCoverBg = false
      }
    },
    applyCoverBg() {
      if (this.$refs.coverBg) {
        this.$refs.coverBg.style.backgroundImage = `url("${this.resolvedSrc}")`
      }
    },
    onImageError() {
      // Guard against a failing placeholder looping the error handler.
      if (this.imageFailed) return
      this.imageFailed = true
      this.showCoverBg = false
      this.$emit('image-error')
    }
  }
}
</script>

<style scoped>
.ns-cover-art {
  background-color: rgb(var(--color-primary));
  /* This element wraps the artwork directly, so the clip lives here rather than
     on .ns-cover-surface, which cards also use for content that overflows. */
  overflow: hidden;
}

.ns-cover-flat {
  overflow: hidden;
}

.ns-cover-art.is-selected {
  box-shadow: var(--cover-shadow), inset 0 0 0 2px rgb(var(--color-success));
}

.ns-cover-fill {
  background-color: rgb(var(--color-primary));
}

.ns-cover-placeholder-title {
  color: rgb(247 223 187);
}

.ns-cover-placeholder-subtitle {
  color: rgb(247 223 187);
  opacity: 0.75;
}
</style>
