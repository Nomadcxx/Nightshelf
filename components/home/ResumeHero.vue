<template>
  <div v-if="item" class="resume-hero relative">
    <!-- The hero's own artwork, blurred out past recognition, so the glass
         below it and the page behind it share one colour source. -->
    <div class="resume-hero__wash" :style="washStyle" aria-hidden="true" />
    <div class="resume-hero__veil" aria-hidden="true" />

    <p class="resume-hero__eyebrow font-mono">{{ $strings.LabelResume || 'Resume' }}</p>

    <div class="resume-hero__body flex gap-3">
      <button type="button" class="resume-hero__cover" :aria-label="title" @click="openItem">
        <img v-if="coverSrc" :src="coverSrc" :alt="title" />
      </button>

      <div class="flex-1 min-w-0 flex flex-col justify-center">
        <p class="resume-hero__title truncate-2">{{ title }}</p>
        <p v-if="author" class="resume-hero__by font-mono truncate">{{ author }}</p>

        <p v-if="remainingText" class="resume-hero__rem font-mono">{{ remainingText }}</p>
        <div class="resume-hero__track" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
          <i :style="{ width: progressPercent + '%' }" />
        </div>

        <button type="button" class="resume-hero__play" @click="play">
          <ui-ph-icon name="play_arrow" :size="16" />
          <span>{{ $strings.ButtonResume }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * The one thing the user is part-way through, given its own slot above the rails.
 *
 * Home previously opened with a stack of identical rails, so the highest-intent
 * item — the book you are 62% through — was indistinguishable from a discovery
 * suggestion. This states it outright, then lets browsing happen underneath.
 *
 * Renders nothing when there is nothing in progress; a hero with no subject is
 * worse than no hero.
 */
export default {
  props: {
    entity: {
      type: Object,
      default: null
    }
  },
  computed: {
    item() {
      const e = this.entity
      if (!e) return null
      return e.libraryItem || e
    },
    isEpisode() {
      return !!this.entity?.recentEpisode
    },
    episode() {
      return this.entity?.recentEpisode || null
    },
    media() {
      return this.item?.media || {}
    },
    metadata() {
      return this.media.metadata || {}
    },
    title() {
      if (this.isEpisode) return this.episode.title || this.metadata.title || ''
      return this.metadata.title || ''
    },
    author() {
      return this.metadata.authorName || this.metadata.author || ''
    },
    coverSrc() {
      if (!this.item?.id) return null
      return this.store.getters['globals/getLibraryItemCoverSrc'](this.item, '/book_placeholder_nightshelf.svg')
    },
    washStyle() {
      return this.coverSrc ? { backgroundImage: `url("${this.coverSrc}")` } : null
    },
    progress() {
      const id = this.item?.id
      if (!id) return null
      return this.store.getters['user/getUserMediaProgress'](id, this.episode?.id)
    },
    progressPercent() {
      const p = Number(this.progress?.progress)
      if (!Number.isFinite(p)) return 0
      return Math.round(Math.min(1, Math.max(0, p)) * 100)
    },
    remainingText() {
      const duration = this.progress?.duration || this.media.duration
      if (!duration || !this.progress) return ''
      const left = duration - (this.progress.currentTime || 0)
      if (!(left > 0)) return ''
      return this.$elapsedPrettyExtended ? this.$elapsedPrettyExtended(left, false) : this.$elapsedPretty(left)
    },
    store() {
      return this.$store || this.$nuxt.$store
    }
  },
  methods: {
    openItem() {
      if (this.$hapticsTap) this.$hapticsTap()
      const to = this.isEpisode ? `/item/${this.item.id}/${this.episode.id}` : `/item/${this.item.id}`
      this.$router.push(to)
    },
    async play() {
      if (this.$hapticsPlaybackStart) await this.$hapticsPlaybackStart()
      this.$eventBus.$emit('play-item', {
        libraryItemId: this.item.id,
        episodeId: this.episode?.id
      })
    }
  }
}
</script>

<style scoped>
.resume-hero {
  padding: 14px 0 16px;
  margin-bottom: 6px;
  isolation: isolate;
  overflow: hidden;
}

.resume-hero__wash {
  position: absolute;
  inset: -20%;
  z-index: -2;
  background-position: center;
  background-size: cover;
  filter: blur(46px) saturate(170%);
  opacity: 0.5;
}

.resume-hero__veil {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(180deg, rgb(15 17 27 / 0.6), rgb(15 17 27 / 0.86));
}

.resume-hero__eyebrow {
  padding: 0 var(--shelf-edge) 8px;
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(var(--color-fg) / 0.55);
}

.resume-hero__body {
  padding: 0 var(--shelf-edge);
}

.resume-hero__cover {
  flex: none;
  width: 132px;
  height: 132px;
  border-radius: var(--radius-cover-lg);
  overflow: hidden;
  box-shadow: var(--cover-shadow-lifted);
  background: rgb(var(--color-primary));
}

.resume-hero__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.resume-hero__title {
  font-size: 1.02rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
  font-weight: 640;
  color: rgb(var(--color-fg));
}

.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resume-hero__by {
  margin-top: 3px;
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(var(--color-fg-muted));
}

.resume-hero__rem {
  margin-top: 9px;
  font-size: 0.62rem;
  color: rgb(var(--color-success));
}

.resume-hero__track {
  margin-top: 6px;
  height: 3px;
  border-radius: 3px;
  background: rgb(var(--color-fg) / 0.14);
  overflow: hidden;
}

.resume-hero__track i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: rgb(var(--color-success));
}

.resume-hero__play {
  margin-top: 11px;
  align-self: flex-start;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgb(var(--color-success));
  color: rgb(var(--color-bg));
  font-size: 0.78rem;
  font-weight: 650;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: opacity var(--motion-instant) var(--ease-night-out);
}

.resume-hero__play:active {
  opacity: 0.72;
}

.resume-hero__play:focus-visible,
.resume-hero__cover:focus-visible {
  outline: 2px solid rgb(var(--color-accent));
  outline-offset: 2px;
  transition: none;
}
</style>
