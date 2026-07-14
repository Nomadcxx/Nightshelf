<template>
  <div class="w-full h-10 bg-bg relative">
    <div id="bookshelf-navbar" class="absolute z-10 top-0 left-0 w-full h-full flex bg-secondary border-b border-border">
      <nuxt-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="h-full flex-grow flex flex-col items-center justify-center relative gap-0.5"
        :class="routeName === item.routeName ? 'text-accent' : 'text-fg-muted'"
      >
        <ui-ph-icon :name="item.icon" :size="18" />
        <p v-if="routeName === item.routeName" class="font-mono text-xxs uppercase tracking-wider">{{ item.text }}</p>
        <span v-if="routeName === item.routeName" class="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-t" />
      </nuxt-link>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    userHasPlaylists() {
      return this.$store.state.libraries.numUserPlaylists
    },
    userIsAdminOrUp() {
      return this.$store.getters['user/getIsAdminOrUp']
    },
    items() {
      let items = []
      if (this.isPodcast) {
        items = [
          { to: '/bookshelf', routeName: 'bookshelf', icon: 'home', text: this.$strings.ButtonHome },
          { to: '/bookshelf/latest', routeName: 'bookshelf-latest', icon: 'list_bullets', text: this.$strings.ButtonLatest },
          { to: '/bookshelf/library', routeName: 'bookshelf-library', icon: 'database', text: this.$strings.ButtonLibrary }
        ]
        if (this.userIsAdminOrUp) {
          items.push({ to: '/bookshelf/add-podcast', routeName: 'bookshelf-add-podcast', icon: 'podcasts', text: this.$strings.ButtonAdd })
        }
      } else {
        items = [
          { to: '/bookshelf', routeName: 'bookshelf', icon: 'home', text: this.$strings.ButtonHome },
          { to: '/bookshelf/library', routeName: 'bookshelf-library', icon: 'database', text: this.$strings.ButtonLibrary },
          { to: '/bookshelf/series', routeName: 'bookshelf-series', icon: 'columns', text: this.$strings.ButtonSeries },
          { to: '/bookshelf/collections', routeName: 'bookshelf-collections', icon: 'collections_bookmark', text: this.$strings.ButtonCollections },
          { to: '/bookshelf/authors', routeName: 'bookshelf-authors', icon: 'authors', text: this.$strings.ButtonAuthors }
        ]
      }

      if (this.userHasPlaylists) {
        items.push({ to: '/bookshelf/playlists', routeName: 'bookshelf-playlists', icon: 'queue_music', text: this.$strings.ButtonPlaylists })
      }

      return items
    },
    routeName() {
      return this.$route.name
    },
    isPodcast() {
      return this.libraryMediaType == 'podcast'
    },
    libraryMediaType() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType']
    }
  }
}
</script>

<style>
#bookshelf-navbar {
  box-shadow: 0 2px 6px rgb(var(--color-bg) / 0.35);
}
</style>
