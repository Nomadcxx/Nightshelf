<template>
  <div class="w-full h-12 bg-bg relative">
    <transition name="nightglass-nav" mode="out-in">
    <div v-if="!collapsed" id="bookshelf-navbar" key="expanded" class="nightglass-nav absolute z-10 top-1 left-2 right-2 flex items-stretch overflow-hidden">
      <nuxt-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="h-10 min-w-0 flex-grow flex flex-col items-center justify-center relative gap-0.5 rounded-lg"
        :class="routeName === item.routeName ? 'nightglass-nav__selected text-accent' : 'text-fg-muted'"
        :aria-label="item.text"
      >
        <ui-ph-icon :name="item.icon" :size="18" />
        <p v-if="routeName === item.routeName" class="font-mono text-xxs uppercase tracking-wider">{{ item.text }}</p>
      </nuxt-link>
      <button type="button" class="h-10 w-12 flex-none flex items-center justify-center border-l border-border text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" :aria-label="$strings.ButtonCollapseNavigation" @click="setCollapsed(true)">
        <ui-ph-icon name="keyboard_arrow_down" :size="20" class="transform rotate-180" />
      </button>
    </div>
    <div v-else key="collapsed" class="absolute z-10 top-1 left-1/2 -translate-x-1/2 h-10 nightglass-nav nightglass-nav--collapsed flex items-center overflow-hidden">
      <nuxt-link v-if="selectedItem" :to="selectedItem.to" class="h-10 pl-4 pr-3 flex items-center gap-2 text-accent" :aria-label="selectedItem.text">
        <ui-ph-icon :name="selectedItem.icon" :size="18" />
        <span class="font-mono text-xxs uppercase tracking-wider">{{ selectedItem.text }}</span>
      </nuxt-link>
      <button type="button" class="h-10 w-12 flex items-center justify-center border-l border-border text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" :aria-label="$strings.ButtonExpandNavigation" @click="setCollapsed(false)">
        <ui-ph-icon name="keyboard_arrow_down" :size="20" />
      </button>
    </div>
    </transition>
  </div>
</template>

<script>
export default {
  data() {
    return {
      collapsed: false
    }
  },
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
    selectedItem() {
      return this.items.find((item) => item.routeName === this.routeName) || this.items[0]
    },
    isPodcast() {
      return this.libraryMediaType == 'podcast'
    },
    libraryMediaType() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType']
    }
  },
  methods: {
    async setCollapsed(collapsed) {
      this.collapsed = collapsed
      await this.$localStore.setBookshelfNavCollapsed(collapsed)
      await this.$hapticsImpact()
    }
  },
  async mounted() {
    this.collapsed = await this.$localStore.getBookshelfNavCollapsed()
  }
}
</script>

<style>
#bookshelf-navbar {
  box-shadow: 0 8px 24px rgb(var(--color-bg) / 0.34), inset 0 1px 0 rgb(var(--color-fg) / 0.08);
}
.nightglass-nav {
  height: 40px;
  border: 1px solid rgb(var(--color-border) / 0.9);
  border-radius: 14px;
  background: linear-gradient(120deg, rgb(var(--color-secondary) / 0.54), rgb(var(--color-bg) / 0.38));
  backdrop-filter: blur(var(--glass-shelf-blur)) saturate(var(--glass-shelf-saturate));
  -webkit-backdrop-filter: blur(var(--glass-shelf-blur)) saturate(var(--glass-shelf-saturate));
}
.nightglass-nav--collapsed {
  box-shadow: 0 8px 22px rgb(var(--color-bg) / 0.35), inset 0 1px 0 rgb(var(--color-fg) / 0.08);
}
.nightglass-nav__selected {
  background: linear-gradient(135deg, rgb(var(--color-accent) / 0.18), rgb(4 209 249 / 0.09));
  box-shadow: inset 0 0 0 1px rgb(var(--color-accent) / 0.28);
}
.nightglass-nav-enter-active,
.nightglass-nav-leave-active {
  transition: opacity 180ms ease, transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}
.nightglass-nav-enter,
.nightglass-nav-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.96);
}
</style>
