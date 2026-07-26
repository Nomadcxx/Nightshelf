<template>
  <div v-if="session" ref="root" class="ns-peek fixed inset-0" :style="{ zIndex: 250 }" @pointerdown.self="close" @keydown="onKeydown" role="dialog" aria-modal="true" :aria-label="descriptor.title">
    <div class="ns-scrim absolute inset-0 bg-black/70" :class="{ 'is-open': isOpen }" @pointerdown="close" />

    <!-- The lifted cover. It is rendered at its destination and transformed back
         to the card's rect for one frame, so the entrance animates transform
         only and the object appears to be the same one the user pressed. -->
    <div v-if="layout" class="ns-peek-cover absolute" :class="{ 'is-open': isOpen }" :style="coverStyle">
      <img v-if="session.coverSrc" :src="session.coverSrc" :alt="descriptor.title" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full flex items-center justify-center bg-primary">
        <p class="text-center px-2 text-sm text-fg-muted">{{ descriptor.title }}</p>
      </div>
    </div>

    <div v-if="layout" class="ns-sheet ns-glass-float ns-peek-panel absolute overflow-hidden flex flex-col" :class="{ 'is-open': isOpen }" :style="panelStyle">
      <div class="px-4 pt-3 pb-2 shrink-0">
        <p class="truncate text-base font-semibold text-fg">{{ descriptor.title }}</p>
        <p v-if="subtitleLine" class="truncate text-xs text-fg-muted mt-0.5">{{ subtitleLine }}</p>
      </div>

      <ul ref="actionList" class="flex-1 overflow-y-auto overscroll-contain pb-2">
        <li v-for="action in actions" :key="action.id">
          <button
            type="button"
            class="ns-peek-action w-full flex items-center gap-3 px-4 text-left"
            :class="{ 'is-destructive': action.destructive, 'is-group-start': action.isGroupStart }"
            :disabled="processing"
            @click="runAction(action)"
          >
            <ui-ph-icon :name="action.icon" :size="20" class="shrink-0" />
            <span class="truncate text-sm">{{ labelFor(action) }}</span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { Dialog } from '@capacitor/dialog'
import { buildShelfEntityActions } from '@/utils/shelfEntityActions'
import { computePeekLayout } from '@/utils/libraryPeekSource'

/**
 * The long-press Peek overlay.
 *
 * Mounted once at the layout root rather than per card. A virtualised shelf
 * recycles cards while scrolling, so a Peek owned by a card could be destroyed
 * mid-gesture; owning it globally means the overlay outlives the card that
 * opened it and can still complete its actions.
 *
 * Cards contribute only data — a descriptor, a cover URL and the rect they
 * occupied. Every action is carried out here.
 */
export default {
  data() {
    return {
      isOpen: false,
      processing: false,
      layout: null,
      originTransform: null,
      closing: false,
      // The element focus came from, so it can be handed back on close.
      returnFocusEl: null
    }
  },
  computed: {
    session() {
      return this.$store.state.globals.peekSession
    },
    descriptor() {
      return this.session?.descriptor || {}
    },
    context() {
      return this.session?.context || {}
    },
    actions() {
      const built = buildShelfEntityActions(this.descriptor, this.context)
      // Flag the first action of each group so the list can show a divider
      // without the pure action model needing to know about rendering.
      let lastGroup = null
      return built.map((action) => {
        const isGroupStart = lastGroup !== null && action.group !== lastGroup
        lastGroup = action.group
        return { ...action, isGroupStart }
      })
    },
    subtitleLine() {
      const { subtitle, type, numItems } = this.descriptor
      if (subtitle) return subtitle
      if (numItems && (type === 'series' || type === 'collection' || type === 'playlist' || type === 'podcast')) {
        return `${numItems} ${numItems === 1 ? this.$strings.LabelEpisode : this.$strings.LabelEpisodes}`
      }
      return ''
    },
    coverStyle() {
      const { cover } = this.layout
      const style = {
        top: `${cover.top}px`,
        left: `${cover.left}px`,
        width: `${cover.width}px`,
        height: `${cover.height}px`
      }
      if (!this.isOpen && this.originTransform) style.transform = this.originTransform
      return style
    },
    panelStyle() {
      const { panel } = this.layout
      return {
        top: `${panel.top}px`,
        left: `${panel.left}px`,
        width: `${panel.width}px`,
        maxHeight: `${panel.height}px`
      }
    },
    libraryItem() {
      return this.session?.source?.libraryItem || null
    },
    episode() {
      return this.session?.source?.episode || null
    }
  },
  watch: {
    session(newVal) {
      if (newVal) this.open()
    }
  },
  methods: {
    labelFor(action) {
      return this.$strings[action.labelKey] || action.labelKey
    },
    /** Focusable children of the panel, in DOM order. */
    focusableActions() {
      if (!this.$refs.actionList) return []
      return Array.from(this.$refs.actionList.querySelectorAll('button:not([disabled])'))
    },
    onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.close()
        return
      }
      if (event.key !== 'Tab') return

      // Focus must not escape an aria-modal dialog into the shelf behind it.
      const items = this.focusableActions()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
    open() {
      this.closing = false
      this.processing = false
      // Captured before the overlay renders, while the card still has focus.
      this.returnFocusEl = document.activeElement instanceof HTMLElement ? document.activeElement : null

      const viewport = { width: window.innerWidth, height: window.innerHeight }
      this.layout = computePeekLayout(this.session.originRect, viewport, { actionCount: this.actions.length })
      if (!this.layout) {
        // Nothing sensible to draw — better to do nothing than to flash a
        // mispositioned overlay.
        this.$store.commit('globals/clearPeekSession')
        return
      }

      this.originTransform = this.buildOriginTransform()
      this.isOpen = false
      // Two frames: one to paint at the origin, one to start the transition.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this.session) this.isOpen = true
        })
      })

      // Move focus into the panel so a keyboard or TalkBack user lands on the
      // actions rather than being left behind on the card.
      this.$nextTick(() => {
        const first = this.focusableActions()[0]
        if (first) first.focus()
      })
    },
    buildOriginTransform() {
      const origin = this.session?.originRect
      const target = this.layout?.cover
      if (!origin || !target || !target.width || !target.height) return null

      const scaleX = origin.width / target.width
      const scaleY = origin.height / target.height
      const dx = origin.left - target.left
      const dy = origin.top - target.top
      return `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`
    },
    close() {
      if (this.closing || !this.session) return
      this.closing = true
      this.isOpen = false

      // Focus goes back to the card immediately rather than after the exit
      // transition; leaving it on a disappearing element strands the caret.
      const returnTo = this.returnFocusEl
      this.returnFocusEl = null
      if (returnTo && typeof returnTo.focus === 'function' && document.contains(returnTo)) {
        returnTo.focus()
      }

      // Let the exit transition run before the session — and with it the
      // overlay — disappears.
      setTimeout(() => {
        this.$store.commit('globals/clearPeekSession')
        this.layout = null
        this.closing = false
      }, 200)
    },
    async runAction(action) {
      if (this.processing) return

      // Navigation should feel immediate, so the overlay leaves first and the
      // route change follows. Everything else keeps the overlay up until done.
      const navigationTargets = {
        viewSeries: () => this.descriptor.seriesId && `/bookshelf/series/${this.descriptor.seriesId}`,
        viewEpisodes: () => this.descriptor.routeTo,
        viewPlaylist: () => this.descriptor.routeTo,
        viewCollection: () => this.descriptor.routeTo,
        moreInfo: () => this.descriptor.routeTo,
        manageLocal: () => this.descriptor.localLibraryItemId && `/localMedia/item/${this.descriptor.localLibraryItemId}`
      }

      if (navigationTargets[action.id]) {
        const to = navigationTargets[action.id]()
        this.close()
        if (to) this.$nextTick(() => this.$router.push(to))
        return
      }

      try {
        this.processing = true
        await this.dispatchAction(action)
      } catch (error) {
        console.error('Peek action failed', action.id, error)
        this.$toast.error(this.$strings.ToastUnknownError || 'Action failed')
      } finally {
        this.processing = false
      }
    },
    async dispatchAction(action) {
      switch (action.id) {
        case 'play':
          return this.playEntity()
        case 'markFinished':
          return this.setFinished(true)
        case 'markNotFinished':
          return this.setFinished(false)
        case 'discardProgress':
          return this.discardProgress()
        case 'addToPlaylist':
          return this.addToPlaylist()
        case 'removeFromPlaylist':
          return this.removeFromPlaylist()
        case 'select':
          return this.selectEntity()
        case 'deleteLocal':
          return this.deleteLocal()
        case 'openWebClient':
          this.$store.dispatch('user/openWebClient', this.descriptor.routeTo)
          this.close()
          return
        default:
          this.close()
      }
    },
    async playEntity() {
      const { type, id, episodeId, localLibraryItemId } = this.descriptor
      this.close()

      if (type === 'series' || type === 'collection' || type === 'playlist') {
        // Groups have no single playable id of their own; open them so the user
        // chooses where to start rather than guessing on their behalf.
        this.$nextTick(() => this.$router.push(this.descriptor.routeTo))
        return
      }

      await this.$hapticsPlaybackStart()
      if (localLibraryItemId && this.descriptor.isLocal) {
        this.$eventBus.$emit('play-item', { libraryItemId: localLibraryItemId, episodeId })
        return
      }
      this.$eventBus.$emit('play-item', { libraryItemId: id, episodeId })
    },
    async setFinished(isFinished) {
      await this.$hapticsSelectionChange()

      if (this.descriptor.isLocal || (this.descriptor.hasLocalCopy && !this.context.isConnectedToServer)) {
        const payload = await this.$db.updateLocalMediaProgressFinished({
          localLibraryItemId: this.descriptor.localLibraryItemId,
          localEpisodeId: this.session?.source?.localEpisodeId || null,
          isFinished
        })
        if (payload?.error) {
          this.$toast.error(payload.error)
        } else if (payload?.localMediaProgress) {
          this.$store.commit('globals/updateLocalMediaProgress', payload.localMediaProgress)
        }
        this.close()
        return
      }

      let url = `/api/me/progress/${this.descriptor.serverId}`
      if (this.descriptor.episodeId) url += `/${this.descriptor.episodeId}`
      await this.$nativeHttp
        .patch(url, { isFinished })
        .catch((error) => {
          console.error('Failed to update finished state', error)
          this.$toast.error(isFinished ? this.$strings.ToastItemMarkedAsFinishedFailed : this.$strings.ToastItemMarkedAsNotFinishedFailed)
        })
      this.close()
    },
    async discardProgress() {
      const { value } = await Dialog.confirm({
        title: this.$strings.HeaderConfirm,
        message: this.$strings.MessageConfirmDiscardProgress
      })
      if (!value) {
        this.processing = false
        return
      }

      await this.$hapticsActionWarning()

      const localProgress = this.descriptor.localLibraryItemId ? this.$store.getters['globals/getLocalMediaProgressById'](this.descriptor.localLibraryItemId, this.descriptor.episodeId || undefined) : null
      if (localProgress) {
        await this.$db.removeLocalMediaProgress(localProgress.id)
        this.$store.commit('globals/removeLocalMediaProgressForItem', localProgress.id)
      }

      const serverProgress = this.descriptor.serverId ? this.$store.getters['user/getUserMediaProgress'](this.descriptor.serverId, this.descriptor.episodeId || undefined) : null
      if (serverProgress?.id) {
        await this.$nativeHttp
          .delete(`/api/me/progress/${serverProgress.id}`)
          .then(() => {
            this.$store.commit('user/removeMediaProgress', serverProgress.id)
          })
          .catch((error) => {
            console.error('Progress reset failed', error)
          })
      }
      this.close()
    },
    addToPlaylist() {
      if (!this.libraryItem) return this.close()
      this.$store.commit('globals/setSelectedPlaylistItems', [{ libraryItem: this.libraryItem, episode: this.episode }])
      this.$store.commit('globals/setShowPlaylistsAddCreateModal', true)
      this.close()
    },
    async removeFromPlaylist() {
      const playlistId = this.context.playlist?.id
      if (!playlistId) return this.close()

      let url = `/api/playlists/${playlistId}/item/${this.descriptor.serverId}`
      if (this.descriptor.episodeId) url += `/${this.descriptor.episodeId}`
      await this.$nativeHttp.delete(url).catch((error) => {
        console.error('Failed to remove item from playlist', error)
        this.$toast.error(this.$strings.ToastRemoveFailed || 'Failed to remove from playlist')
      })
      this.close()
    },
    selectEntity() {
      // Selection lives on the shelf that owns the cards, so it is announced
      // rather than performed here.
      this.$eventBus.$emit('peek-select-entity', { descriptor: this.descriptor, source: this.session?.source || null })
      this.close()
    },
    async deleteLocal() {
      const { value } = await Dialog.confirm({
        title: this.$strings.HeaderConfirm,
        message: this.$strings.MessageConfirmDeleteLocalFiles
      })
      if (!value) {
        this.processing = false
        return
      }
      await this.$hapticsActionWarning()
      this.$eventBus.$emit('peek-delete-local', { descriptor: this.descriptor })
      this.close()
    }
  },
  mounted() {
    this.$eventBus.$on('close-peek', this.close)
  },
  beforeDestroy() {
    this.$eventBus.$off('close-peek', this.close)
  }
}
</script>

<style scoped>
.ns-peek-cover {
  border-radius: var(--radius-cover);
  overflow: hidden;
  box-shadow: var(--cover-shadow-lifted);
  transform-origin: top left;
  opacity: 0;
  transition: transform var(--motion-spatial) var(--ease-night-out), opacity var(--motion-fast) var(--ease-night-out);
}

.ns-peek-cover.is-open {
  transform: none;
  opacity: 1;
}

.ns-peek-panel {
  border-radius: var(--radius-surface);
}

.ns-peek-action {
  min-height: 48px;
  color: rgb(var(--color-fg));
  transition: opacity var(--motion-instant) var(--ease-night-out);
}

.ns-peek-action:active {
  opacity: 0.6;
}

.ns-peek-action:disabled {
  opacity: 0.4;
}

.ns-peek-action.is-destructive {
  color: rgb(var(--color-error));
}

.ns-peek-action.is-group-start {
  border-top: 1px solid rgb(var(--color-fg) / 0.12);
}

[data-motion='reduced'] .ns-peek-cover,
[data-motion='reduced'] .ns-peek-cover.is-open {
  transform: none;
  transition-property: opacity;
  transition-duration: 150ms;
}

@media (prefers-reduced-motion: reduce) {
  .ns-peek-cover,
  .ns-peek-cover.is-open {
    transform: none;
    transition-property: opacity;
    transition-duration: 150ms;
  }
}
</style>
