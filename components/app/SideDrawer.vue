<template>
  <div class="fixed top-0 left-0 right-0 layout-wrapper w-full z-50 overflow-hidden pointer-events-none">
    <div class="absolute top-0 left-0 w-full h-full bg-black transition-opacity duration-200" :class="show ? 'bg-opacity-60 pointer-events-auto' : 'bg-opacity-0'" @click="clickBackground" />
    <div class="absolute top-0 right-0 w-72 h-full bg-bg border-l border-border transform transition-transform py-5 pointer-events-auto flex flex-col" :class="show ? '' : 'translate-x-72'" @click.stop>
      <div class="px-5 mb-5 flex items-center gap-3">
        <img src="/Logo.png" alt="" class="h-10 w-10" />
        <div class="min-w-0">
          <p class="font-semibold text-fg">Night<span class="text-accent">shelf</span></p>
          <p v-if="user" class="font-mono text-xxs uppercase tracking-widest text-fg-muted truncate">{{ username }}</p>
          <p v-else class="font-mono text-xxs uppercase tracking-widest text-error">server: offline</p>
        </div>
      </div>

      <div class="w-full overflow-y-auto flex-grow">
        <template v-for="item in navItems">
          <button
            v-if="item.action"
            :key="'a-' + item.text"
            :tabindex="show ? 0 : -1"
            type="button"
            class="w-full flex items-center py-3 px-5 text-fg-muted border-l-2 border-transparent hover:bg-secondary/40"
            @click="clickAction(item.action)"
          >
            <ui-ph-icon :name="item.icon" :size="20" />
            <p class="pl-3 text-sm">{{ item.text }}</p>
          </button>
          <nuxt-link
            v-else
            :key="'l-' + item.text"
            :to="item.to"
            :tabindex="show ? 0 : -1"
            class="w-full flex items-center py-3 px-5 border-l-2"
            :class="isActive(item.to) ? 'border-accent bg-secondary/50 text-fg' : 'border-transparent text-fg-muted hover:bg-secondary/30'"
          >
            <ui-ph-icon :name="item.icon" :size="20" :class="isActive(item.to) ? 'text-accent' : ''" />
            <p class="pl-3 text-sm">{{ item.text }}</p>
          </nuxt-link>
        </template>
      </div>

      <div class="px-5 pt-4 border-t border-border text-fg">
        <div v-if="serverConnectionConfig" class="mb-3">
          <p class="text-xxs font-mono text-fg-muted break-all">{{ serverConnectionConfig.address }} · v{{ serverSettings.version }}</p>
        </div>
        <div class="flex items-center">
          <p class="text-xxs font-mono text-fg-muted">{{ $config.version }}</p>
          <div class="flex-grow" />
          <button v-if="user" type="button" class="flex items-center gap-2 text-fg-muted" @click="disconnect">
            <ui-status-dot tone="offline" :size="7" />
            <span class="text-xs">{{ $strings.ButtonDisconnect }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TouchEvent from '@/objects/TouchEvent'
import { AbsAudioPlayer } from '@/plugins/capacitor'

export default {
  data() {
    return {
      touchEvent: null
    }
  },
  watch: {
    $route: {
      handler() {
        this.show = false
      }
    },
    show: {
      handler(newVal) {
        if (newVal) this.registerListener()
        else this.removeListener()
      }
    }
  },
  computed: {
    show: {
      get() {
        return this.$store.state.showSideDrawer
      },
      set(val) {
        this.$store.commit('setShowSideDrawer', val)
      }
    },
    user() {
      return this.$store.state.user.user
    },
    serverConnectionConfig() {
      return this.$store.state.user.serverConnectionConfig
    },
    serverSettings() {
      return this.$store.state.serverSettings || {}
    },
    username() {
      return this.user?.username || ''
    },
    navItems() {
      var items = [
        {
          icon: 'home',
          text: this.$strings.ButtonHome,
          to: '/bookshelf'
        }
      ]
      if (!this.serverConnectionConfig) {
        items = [
          {
            icon: 'cloud_off',
            text: this.$strings.ButtonConnectToServer,
            to: '/connect'
          }
        ].concat(items)
      } else {
        items.push({
          icon: 'person',
          text: this.$strings.HeaderAccount,
          to: '/account'
        })
        items.push({
          icon: 'equalizer',
          text: this.$strings.ButtonUserStats,
          to: '/stats'
        })
        if (this.isCastAvailable) {
          items.push({
            icon: this.isCasting ? 'cast_connected' : 'cast',
            text: 'Cast',
            action: 'cast'
          })
        }
      }

      if (this.$platform !== 'ios') {
        items.push({
          icon: 'folder',
          text: this.$strings.ButtonLocalMedia,
          to: '/localMedia/folders'
        })
      } else {
        items.push({
          icon: 'download',
          text: this.$strings.HeaderDownloads,
          to: '/downloads'
        })
      }
      items.push({
        icon: 'settings',
        text: this.$strings.HeaderSettings,
        to: '/settings'
      })

      items.push({
        icon: 'bug_report',
        text: this.$strings.ButtonLogs,
        to: '/logs'
      })

      if (this.serverConnectionConfig) {
        items.push({
          icon: 'language',
          text: this.$strings.ButtonGoToWebClient,
          action: 'openWebClient'
        })

        items.push({
          icon: 'login',
          text: this.$strings.ButtonSwitchServerUser,
          action: 'logout'
        })
      }

      return items
    },
    isCastAvailable() {
      return this.$store.state.isCastAvailable
    },
    isCasting() {
      return this.$store.state.isCasting
    }
  },
  methods: {
    isActive(to) {
      return this.$route.path === to || this.$route.path.startsWith(to + '/')
    },
    async clickAction(action) {
      await this.$hapticsImpact()
      if (action === 'logout') {
        await this.logout()
        this.$router.push('/connect')
      } else if (action === 'cast') {
        this.show = false
        if (this.$store.getters['getIsCurrentSessionLocal']) {
          this.$eventBus.$emit('cast-local-item')
          return
        }
        AbsAudioPlayer.requestSession()
      } else if (action === 'openWebClient') {
        this.show = false
        let path = `/library/${this.$store.state.libraries.currentLibraryId}`
        await this.$store.dispatch('user/openWebClient', path)
      }
    },
    clickBackground() {
      this.show = false
    },
    async disconnect() {
      await this.logout()
      this.$router.push('/connect')
    },
    async logout() {
      this.show = false
      await this.$store.dispatch('user/logout')
    },
    touchstart(e) {
      this.touchEvent = new TouchEvent(e)
    },
    touchend(e) {
      if (!this.touchEvent) return
      this.touchEvent.setEndEvent(e)
      if (this.touchEvent.isSwipeLeft()) this.show = false
      this.touchEvent = null
    },
    registerListener() {
      document.addEventListener('touchstart', this.touchstart)
      document.addEventListener('touchend', this.touchend)
    },
    removeListener() {
      document.removeEventListener('touchstart', this.touchstart)
      document.removeEventListener('touchend', this.touchend)
    }
  },
  beforeDestroy() {
    this.removeListener()
  }
}
</script>
