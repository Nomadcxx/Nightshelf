<template>
  <div class="w-full h-full bg-bg">
    <div class="relative flex items-center justify-center min-h-screen px-4">
      <nuxt-link to="/" class="absolute top-2 left-2 z-20 h-10 w-10 flex items-center justify-center rounded-full" aria-label="Back">
        <ui-ph-icon name="arrow_back" :size="28" class="text-fg" />
      </nuxt-link>

      <div class="w-full max-w-sm flex flex-col items-center">
        <img src="/Logo.png" alt="Nightshelf" class="h-16 w-16 mb-3" />
        <h1 class="text-2xl font-sans font-semibold tracking-tight text-fg">
          Night<span class="text-accent">shelf</span>
        </h1>
        <p class="mt-1 mb-6 font-mono text-xxs uppercase tracking-widest text-success">connect --library</p>

        <connection-server-connect-form v-if="deviceData" class="w-full" />
      </div>
    </div>

    <div class="flex items-center justify-center pt-4 fixed bottom-4 left-0 right-0 px-4">
      <a href="https://github.com/Nomadcxx/audiobookshelf-app" target="_blank" class="text-sm text-fg-muted pr-2">{{ $strings.MessageFollowTheProjectOnGithub }}</a>
      <a href="https://github.com/Nomadcxx/audiobookshelf-app" target="_blank" aria-label="GitHub"
        ><svg class="w-7 h-7 text-fg-muted" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="28" height="28" viewBox="0 0 24 24">
          <path
            d="M12 2.247a10 10 0 0 0-3.162 19.487c.5.088.687-.212.687-.475c0-.237-.012-1.025-.012-1.862c-2.513.462-3.163-.613-3.363-1.175a3.636 3.636 0 0 0-1.025-1.413c-.35-.187-.85-.65-.013-.662a2.001 2.001 0 0 1 1.538 1.025a2.137 2.137 0 0 0 2.912.825a2.104 2.104 0 0 1 .638-1.338c-2.225-.25-4.55-1.112-4.55-4.937a3.892 3.892 0 0 1 1.025-2.688a3.594 3.594 0 0 1 .1-2.65s.837-.262 2.75 1.025a9.427 9.427 0 0 1 5 0c1.912-1.3 2.75-1.025 2.75-1.025a3.593 3.593 0 0 1 .1 2.65a3.869 3.869 0 0 1 1.025 2.688c0 3.837-2.338 4.687-4.563 4.937a2.368 2.368 0 0 1 .675 1.85c0 1.338-.012 2.413-.012 2.75c0 .263.187.575.687.475A10.005 10.005 0 0 0 12 2.247z"
            fill="currentColor"
          /></svg
      ></a>
    </div>
  </div>
</template>

<script>
export default {
  layout: 'blank',
  data() {
    return {
      deviceData: null
    }
  },
  methods: {
    async init() {
      await this.$store.dispatch('setupNetworkListener')
      this.deviceData = await this.$db.getDeviceData()
      this.$store.commit('setDeviceData', this.deviceData)
    }
  },
  mounted() {
    this.$store.commit('libraries/reset')
    this.$store.commit('setIsFirstLoad', true)
    this.init()
  }
}
</script>
