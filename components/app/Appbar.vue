<template>
  <div class="w-full h-16 bg-secondary border-b border-border relative z-20">
    <div id="appbar" class="absolute top-0 left-0 w-full h-full flex items-center px-3 gap-2">
      <nuxt-link v-show="!showBack" to="/" class="flex-none">
        <img src="/Logo.png" alt="" class="h-9 w-9" />
      </nuxt-link>
      <button v-if="showBack" type="button" aria-label="Back" class="rounded-full h-10 w-10 flex items-center justify-center flex-none" @click="back">
        <ui-ph-icon name="arrow_back" :size="26" class="text-fg" />
      </button>

      <nuxt-link to="/bookshelf" class="min-w-0 leading-none mr-1">
        <p class="font-sans font-semibold text-base text-fg truncate">Night<span class="text-accent">shelf</span></p>
        <p class="font-mono uppercase tracking-widest text-xxs text-success mt-0.5 truncate">{{ monoStatus }}</p>
      </nuxt-link>

      <button
        v-if="user && currentLibrary"
        type="button"
        aria-label="Show library modal"
        class="hidden xs:flex pl-2 pr-2.5 py-1.5 bg-bg border border-border rounded-md items-center max-w-28"
        @click="clickShowLibraryModal"
      >
        <ui-library-icon :icon="currentLibraryIcon" :size="4" font-size="base" />
        <p class="text-xs leading-4 ml-1.5 mt-0.5 truncate font-mono">{{ currentLibraryName }}</p>
      </button>

      <div class="flex-grow" />

      <widgets-connection-indicator />

      <nuxt-link v-if="user" class="mx-1 flex items-center justify-center h-10 w-10 text-fg" to="/search" aria-label="Search">
        <ui-ph-icon name="search" :size="22" />
      </nuxt-link>

      <button type="button" aria-label="Toggle side drawer" class="h-10 w-10 flex items-center justify-center text-fg" @click="clickShowSideDrawer">
        <ui-ph-icon name="menu" :size="24" class="text-success" />
      </button>
    </div>
  </div>
</template>

<script>
import { AbsAudioPlayer } from '@/plugins/capacitor'
import { statusLabel } from '@/utils/appbarStatus'

export default {
  data() {
    return {
      onCastAvailableUpdateListener: null,
      theme: 'night'
    }
  },
  computed: {
    isCastAvailable: {
      get() {
        return this.$store.state.isCastAvailable
      },
      set(val) {
        this.$store.commit('setCastAvailable', val)
      }
    },
    currentLibrary() {
      return this.$store.getters['libraries/getCurrentLibrary']
    },
    currentLibraryName() {
      return this.currentLibrary?.name || ''
    },
    currentLibraryIcon() {
      return this.currentLibrary?.icon || 'database'
    },
    showBack() {
      if (!this.$route.name) return true
      return this.$route.name !== 'index' && !this.$route.name.startsWith('bookshelf')
    },
    user() {
      return this.$store.state.user.user
    },
    monoStatus() {
      return statusLabel({ routeName: this.$route.name, theme: this.theme })
    }
  },
  methods: {
    clickShowSideDrawer() {
      this.$store.commit('setShowSideDrawer', true)
    },
    clickShowLibraryModal() {
      this.$store.commit('libraries/setShowModal', true)
    },
    back() {
      window.history.back()
    },
    onCastAvailableUpdate(data) {
      this.isCastAvailable = data && data.value
    },
    async refreshTheme() {
      const stored = await this.$localStore?.getTheme()
      this.theme = stored || document.documentElement.dataset.theme || 'night'
    }
  },
  async mounted() {
    await this.refreshTheme()
    AbsAudioPlayer.getIsCastAvailable().then((data) => {
      this.isCastAvailable = data && data.value
    })
    this.onCastAvailableUpdateListener = await AbsAudioPlayer.addListener('onCastAvailableUpdate', this.onCastAvailableUpdate)
  },
  beforeDestroy() {
    this.onCastAvailableUpdateListener?.remove()
  }
}
</script>
