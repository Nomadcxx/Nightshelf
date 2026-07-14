<template>
  <button v-if="tone" type="button" class="flex h-full items-center px-1.5" :aria-label="$strings.HeaderConnectionStatus" @click="showAlertDialog">
    <ui-status-dot :tone="tone" :size="8" />
  </button>
</template>

<script>
import { Dialog } from '@capacitor/dialog'
import { toneFromState } from '@/utils/connectionStatus'

export default {
  computed: {
    user() {
      return this.$store.state.user.user
    },
    socketConnected() {
      return this.$store.state.socketConnected
    },
    networkConnected() {
      return this.$store.state.networkConnected
    },
    networkConnectionType() {
      return this.$store.state.networkConnectionType
    },
    isNetworkUnmetered() {
      return this.$store.state.isNetworkUnmetered
    },
    isCellular() {
      return this.networkConnectionType === 'cellular'
    },
    attemptingConnection() {
      return this.$store.state.attemptingConnection
    },
    tone() {
      if (!this.user && !this.attemptingConnection) return null
      return toneFromState({
        attempting: this.attemptingConnection,
        networkConnected: this.networkConnected,
        socketConnected: this.socketConnected
      })
    }
  },
  methods: {
    showAlertDialog() {
      var msg = ''
      if (this.attemptingConnection) {
        msg = this.$strings.MessageAttemptingServerConnection
      } else if (!this.networkConnected) {
        msg = this.$strings.MessageNoNetworkConnection
      } else if (!this.socketConnected) {
        msg = this.$strings.MessageSocketNotConnected
      } else if (this.isCellular) {
        msg = this.isNetworkUnmetered ? this.$strings.MessageSocketConnectedOverUnmeteredCellular : this.$strings.MessageSocketConnectedOverMeteredCellular
      } else {
        msg = this.isNetworkUnmetered ? this.$strings.MessageSocketConnectedOverUnmeteredWifi : this.$strings.MessageSocketConnectedOverMeteredWifi
      }
      Dialog.alert({
        title: this.$strings.HeaderConnectionStatus,
        message: msg
      })
    }
  }
}
</script>
