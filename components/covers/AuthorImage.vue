<template>
  <nuxt-link :to="`/bookshelf/library?filter=authors.${$encode(authorId)}`" ref="wrapper" :class="`rounded-${rounded}`" class="w-full h-full bg-primary overflow-hidden">
    <!-- No portrait. Upstream drew a figure SVG at 140% with -20% margins, so
         it overflowed the card as a large pale blob. A monogram on the theme's
         own card surface reads as deliberate at every size the grid uses, and
         it distinguishes one author from the next, which the figure did not. -->
    <div v-if="!imagePath" class="ns-author-placeholder w-full h-full flex items-center justify-center bg-secondary">
      <span class="ns-author-monogram font-mono text-fg-muted" aria-hidden="true">{{ monogram }}</span>
    </div>
    <div v-else class="w-full h-full relative">
      <div v-if="showCoverBg" class="cover-bg absolute" :style="{ backgroundImage: `url(${imgSrc})` }" />
      <img ref="img" :src="imgSrc" @load="imageLoaded" class="absolute top-0 left-0 h-full w-full" :class="coverContain ? 'object-contain' : 'object-cover'" />
    </div>
  </nuxt-link>
</template>

<script>
export default {
  props: {
    author: {
      type: Object,
      default: () => {}
    },
    rounded: {
      type: String,
      default: 'lg'
    }
  },
  data() {
    return {
      showCoverBg: false,
      coverContain: true
    }
  },
  computed: {
    _author() {
      return this.author || {}
    },
    authorId() {
      return this._author.id
    },
    monogram() {
      // Initials from the first and last name parts; one letter is fine when
      // an author is mononymous, and the box is never left empty.
      const parts = String(this._author.name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
      if (!parts.length) return '?'
      const first = parts[0][0]
      const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
      return (first + last).toUpperCase()
    },
    imagePath() {
      return this._author.imagePath
    },
    updatedAt() {
      return this._author.updatedAt
    },
    serverAddress() {
      return this.$store.getters['user/getServerAddress']
    },
    imgSrc() {
      if (!this.imagePath || !this.serverAddress) return null
      const urlQuery = new URLSearchParams({ ts: this.updatedAt })
      if (this.$store.getters.getDoesServerImagesRequireToken) {
        urlQuery.append('token', this.$store.getters['user/getToken'])
      }
      if (process.env.NODE_ENV !== 'production' && this.serverAddress.startsWith('http://192.168')) {
        // Testing
        return `http://localhost:3333/api/authors/${this.authorId}/image?${urlQuery.toString()}`
      }
      return `${this.serverAddress}/api/authors/${this.authorId}/image?${urlQuery.toString()}`
    }
  },
  methods: {
    imageLoaded() {
      var aspectRatio = 1.25
      if (this.$refs.wrapper) {
        aspectRatio = this.$refs.wrapper.clientHeight / this.$refs.wrapper.clientWidth
      }
      if (this.$refs.img) {
        var { naturalWidth, naturalHeight } = this.$refs.img
        var imgAr = naturalHeight / naturalWidth
        var arDiff = Math.abs(imgAr - aspectRatio)
        if (arDiff > 0.15) {
          this.showCoverBg = true
        } else {
          this.showCoverBg = false
          this.coverContain = false
        }
      }
    }
  },
  mounted() {}
}
</script>
<style scoped>
.ns-author-placeholder {
  container-type: inline-size;
}

.ns-author-monogram {
  font-size: clamp(1.25rem, 28cqw, 3.5rem);
  letter-spacing: 0.08em;
}
</style>
