<template>
  <div v-if="playbackSession" id="streamContainer" class="fixed top-0 left-0 layout-wrapper right-0 z-50 pointer-events-none" :class="{ fullscreen: showFullscreen, 'ios-player': $platform === 'ios', 'web-player': $platform === 'web' }">
    <div v-if="showFullscreen" class="w-full h-full z-10 absolute top-0 left-0 pointer-events-auto terminal-player-bg">
      <div class="nightglass-player-accent-rail absolute pointer-events-none" aria-hidden="true" />

      <section class="nightglass-full-header absolute z-20 flex items-center pointer-events-auto">
        <button type="button" :aria-label="$strings.ButtonCollapsePlayer" class="nightglass-full-header__control h-12 w-12 flex items-center justify-center text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" @click="collapseFullscreen">
          <ui-ph-icon name="keyboard_arrow_down" :size="34" />
        </button>
        <p class="nightglass-full-header__status absolute left-16 right-28 mx-auto text-center font-mono uppercase tracking-[0.22em] text-success" style="font-size: 10px">
          {{ isDirectPlayMethod ? $strings.LabelPlaybackDirect : isLocalPlayMethod ? $strings.LabelPlaybackLocal : $strings.LabelPlaybackTranscode }}
        </p>
        <div class="ml-auto flex items-center gap-1">
          <button v-show="showCastBtn" type="button" :aria-label="$strings.ButtonCast" class="nightglass-full-header__control h-12 w-12 flex items-center justify-center text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" @click="castClick">
            <ui-ph-icon :name="isCasting ? 'cast_connected' : 'cast'" :size="26" />
          </button>
          <button type="button" :aria-label="$strings.ButtonMoreOptions" class="nightglass-full-header__control h-12 w-12 flex items-center justify-center text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" @click="showMoreMenuDialog = true">
            <ui-ph-icon name="more_vert" :size="26" />
          </button>
        </div>
      </section>
    </div>

    <div v-if="playerSettings.useChapterTrack && playerSettings.useTotalTrack && showFullscreen" class="absolute total-track w-full z-30 px-6">
      <div class="flex items-center gap-2 font-mono text-fg" style="font-size: 0.75rem">
        <span class="text-success">[</span>
        <p>{{ currentTimePretty }}</p>
        <div class="flex-grow" />
        <p>{{ totalTimeRemainingPretty }}</p>
        <span class="text-success">]</span>
      </div>
      <div class="w-full mt-1">
        <div class="h-4 w-full relative">
          <ui-synthwave-progress :progress="totalTrackProgress" :buffered="totalTrackBufferedProgress" :playing="isProgressAnimating" variant="full" />
        </div>
      </div>
    </div>

    <div v-if="showFullscreen" class="cover-wrapper terminal-cover absolute z-30 pointer-events-auto" @click="clickContainer">
      <div class="w-full h-full flex justify-center">
        <covers-book-cover v-if="libraryItem || localLibraryItemCoverSrc" ref="cover" :library-item="libraryItem" :download-cover="localLibraryItemCoverSrc" :width="bookCoverWidth" :book-cover-aspect-ratio="bookCoverAspectRatio" raw />
      </div>

      <div v-if="syncStatus === $constants.SyncStatus.FAILED" class="absolute top-0 left-0 w-full h-full flex items-center justify-center z-30" @click.stop="showSyncsFailedDialog">
        <ui-ph-icon name="error" :size="32" class="text-error" />
      </div>
    </div>

    <div v-if="showFullscreen" class="title-author-texts terminal-title-panel absolute z-30 left-0 right-0 overflow-hidden" @click="clickTitleAndAuthor">
      <div ref="titlewrapper" class="overflow-hidden relative">
        <p class="title-text whitespace-nowrap"></p>
      </div>
      <p class="author-text text-fg text-opacity-75 truncate font-mono" :class="{ 'text-xxs uppercase tracking-widest': showFullscreen }">{{ authorName }}</p>
    </div>

    <div v-if="showFullscreen" id="playerContent" class="playerContainer w-full z-20 absolute bottom-0 left-0 right-0 p-2 pointer-events-auto transition-all" @click="clickContainer">
      <div v-if="showFullscreen" class="absolute bottom-4 left-0 right-0 w-full pb-4 pt-2 mx-auto px-6" style="max-width: 414px">
        <div class="nightglass-player-actions flex items-center justify-between pointer-events-auto">
          <svg class="nightglass-player-actions__notch" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
            <path d="M18 1 H163 C175 1 176 22 200 22 C224 22 225 1 237 1 H382" />
          </svg>
          <button v-if="!isPodcast && serverLibraryItemId && socketConnected" type="button" :aria-label="$strings.LabelYourBookmarks" class="h-12 w-12 flex items-center justify-center text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" @click.stop="$emit('showBookmarks')">
            <ui-ph-icon name="bookmark" :size="28" :weight="bookmarks.length ? 'fill' : 'regular'" />
          </button>
          <span v-else class="inline-block h-12 w-12" style="opacity: 0" aria-hidden="true" />

          <button type="button" :aria-label="$strings.LabelPlaybackSpeed" class="h-12 min-w-12 px-2 font-mono text-fg-muted tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" style="font-size: 1.15rem" @click.stop="$emit('selectPlaybackSpeed')">{{ currentPlaybackRate }}x</button>
          <button v-if="!sleepTimerRunning" type="button" :aria-label="$strings.LabelSleepTimer" class="h-12 w-12 flex items-center justify-center text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" @click.stop="$emit('showSleepTimer')">
            <ui-ph-icon name="moon" :size="26" />
          </button>
          <button v-else type="button" :aria-label="$strings.LabelSleepTimer" class="h-12 min-w-12 px-2 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" @click.stop="$emit('showSleepTimer')">
            <p class="text-sm font-mono text-success">{{ sleepTimeRemainingPretty }}</p>
          </button>

          <button type="button" :aria-label="$strings.LabelChapters" class="h-12 w-12 flex items-center justify-center text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" :class="chapters.length ? 'text-opacity-75' : 'text-opacity-10'" @click.stop="clickChaptersBtn">
            <ui-ph-icon name="format_list_bulleted" :size="28" />
          </button>
        </div>
      </div>
      <div id="playerControls" class="absolute right-0 bottom-0 mx-auto" style="max-width: 414px">
        <div class="flex items-center max-w-full" :class="playerSettings.lockUi ? 'justify-center' : 'justify-between'">
          <ui-icon-btn v-show="showFullscreen && !playerSettings.lockUi" class="next-icon text-fg cursor-pointer" :class="showLoadingState ? 'text-opacity-10' : 'text-opacity-75'" icon="skip_previous" :aria-label="$strings.ButtonPreviousChapter" large borderless @click="jumpChapterStart" />
          <div v-show="!playerSettings.lockUi" class="jump-icon min-h-12 min-w-12 text-fg cursor-pointer flex flex-col items-center justify-center" :class="showLoadingState ? 'text-opacity-10' : 'text-opacity-75'" @click.stop="jumpBackwards">
            <ui-ph-icon name="replay" :size="showFullscreen ? 32 : 24" />
            <span v-if="showFullscreen" class="jump-label text-[10px] font-mono uppercase tracking-wider leading-tight">{{ jumpBackwardsLabel }}</span>
          </div>
          <ui-icon-btn
            class="play-btn cursor-pointer text-success mx-4 relative overflow-hidden terminal-play-btn"
            :class="{ 'animate-spin': seekLoading }"
            :icon="seekLoading ? 'autorenew' : !isPlaying ? 'play_arrow' : 'pause'"
            :loading="showLoadingState"
            borderless
            @click="playPauseClick"
          />
          <div v-show="!playerSettings.lockUi" class="jump-icon min-h-12 min-w-12 text-fg cursor-pointer flex flex-col items-center justify-center" :class="showLoadingState ? 'text-opacity-10' : 'text-opacity-75'" @click.stop="jumpForward">
            <ui-ph-icon name="forward_media" :size="showFullscreen ? 32 : 24" />
            <span v-if="showFullscreen" class="jump-label text-[10px] font-mono uppercase tracking-wider leading-tight">{{ jumpForwardLabel }}</span>
          </div>
          <ui-icon-btn v-show="showFullscreen && !playerSettings.lockUi" class="next-icon text-fg cursor-pointer" :class="nextChapter && !showLoadingState ? 'text-opacity-75' : 'text-opacity-10'" icon="skip_next" :aria-label="$strings.ButtonNextChapter" large borderless @click="jumpNextChapter" />
        </div>
      </div>

      <div id="playerTrack" class="absolute left-0 w-full px-6">
        <div class="flex pointer-events-none items-center gap-1.5">
          <span v-if="showFullscreen" class="font-mono text-success" style="font-size: 0.75rem">[</span>
          <p class="font-mono text-fg" style="font-size: 0.75rem" ref="currentTimestamp">0:00</p>
          <div class="flex-grow" />
          <p class="font-mono text-fg" style="font-size: 0.75rem">{{ timeRemainingPretty }}</p>
          <span v-if="showFullscreen" class="font-mono text-success" style="font-size: 0.75rem">]</span>
        </div>
        <div ref="track" class="h-4 w-full relative" :class="{ 'animate-pulse': showLoadingState }" @click.stop>
          <ui-synthwave-progress :progress="trackProgress" :buffered="trackBufferedProgress" :playing="isProgressAnimating" :variant="showFullscreen ? 'full' : 'mini'" />
          <div ref="trackCursor" class="h-7 w-7 absolute pointer-events-auto flex items-center justify-center" :style="{ top: '-6px', left: `${trackCursorLeft}px` }" :class="{ 'opacity-0': playerSettings.lockUi || !showFullscreen }" @touchstart="touchstartCursor">
            <div class="synthwave-playhead pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <section v-else class="nightglass-mini-player pointer-events-auto" :aria-label="title" @click="clickContainer">
      <button type="button" class="nightglass-mini-player__cover" :aria-label="title" @click.stop="clickContainer">
        <covers-book-cover v-if="libraryItem || localLibraryItemCoverSrc" :library-item="libraryItem" :download-cover="localLibraryItemCoverSrc" :width="bookCoverWidth" :book-cover-aspect-ratio="bookCoverAspectRatio" raw />
      </button>

      <button type="button" class="nightglass-mini-player__metadata min-w-0 text-left" @click.stop="clickContainer">
        <div ref="titlewrapper" class="overflow-hidden relative">
          <p class="title-text truncate text-sm text-fg">{{ title }}</p>
        </div>
        <p class="mt-0.5 truncate font-mono text-xxs uppercase tracking-wider text-fg-muted">{{ authorName }}</p>
      </button>

      <div class="nightglass-mini-player__controls" @click.stop>
        <button type="button" :aria-label="jumpBackwardsLabel" class="h-12 w-12 flex items-center justify-center text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" :disabled="showLoadingState" @click="jumpBackwards">
          <ui-ph-icon name="replay" :size="25" />
        </button>
        <button type="button" :aria-label="!isPlaying ? $strings.ButtonPlay : $strings.ButtonPause" class="h-12 w-12 flex items-center justify-center border border-success/60 rounded-lg text-success bg-bg/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" :disabled="showLoadingState" @click="playPauseClick">
          <ui-ph-icon :name="seekLoading ? 'autorenew' : !isPlaying ? 'play_arrow' : 'pause'" :size="28" />
        </button>
        <button type="button" :aria-label="jumpForwardLabel" class="h-12 w-12 flex items-center justify-center text-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" :disabled="showLoadingState" @click="jumpForward">
          <ui-ph-icon name="forward_media" :size="25" />
        </button>
      </div>

      <div ref="track" class="nightglass-mini-player__track" :class="{ 'animate-pulse': showLoadingState }" @click.stop>
        <div class="flex items-center font-mono text-xxs text-fg-muted">
          <p ref="currentTimestamp">0:00</p>
          <div class="flex-grow" />
          <p>{{ timeRemainingPretty }}</p>
        </div>
        <div class="h-4 w-full">
          <ui-synthwave-progress :progress="trackProgress" :buffered="trackBufferedProgress" :playing="isProgressAnimating" variant="mini" />
        </div>
      </div>
    </section>

    <modals-chapters-modal v-model="showChapterModal" :current-chapter="currentChapter" :chapters="chapters" :playback-rate="currentPlaybackRate" @select="selectChapter" />
    <modals-dialog v-model="showMoreMenuDialog" :items="menuItems" width="80vw" @action="clickMenuAction" />
  </div>
</template>

<script>
import { Capacitor } from '@capacitor/core'
import { AbsAudioPlayer } from '@/plugins/capacitor'
import { Dialog } from '@capacitor/dialog'
import WrappingMarquee from '@/assets/WrappingMarquee.js'
import jumpLabelMixin from '@/mixins/jumpLabel'

export default {
  props: {
    bookmarks: {
      type: Array,
      default: () => []
    },
    sleepTimerRunning: Boolean,
    sleepTimeRemaining: Number,
    serverLibraryItemId: String
  },
  mixins: [jumpLabelMixin],
  data() {
    return {
      windowHeight: 0,
      windowWidth: 0,
      playbackSession: null,
      showChapterModal: false,
      showFullscreen: false,
      totalDuration: 0,
      currentPlaybackRate: 1,
      currentTime: 0,
      bufferedTime: 0,
      playInterval: null,
      trackWidth: 0,
      isPlaying: false,
      isEnded: false,
      volume: 0.5,
      readyTrackWidth: 0,
      readyProgress: 0,
      trackProgress: 0,
      bufferedProgress: 0,
      totalTrackProgress: 0,
      totalBufferedProgress: 0,
      totalReadyProgress: 0,
      seekedTime: 0,
      seekLoading: false,
      touchStartY: 0,
      touchStartTime: 0,
      playerSettings: {
        useChapterTrack: false,
        useTotalTrack: true,
        scaleElapsedTimeBySpeed: true,
        lockUi: false
      },
      isLoading: false,
      isCheckingServerProgress: false,
      isDraggingCursor: false,
      draggingTouchStartX: 0,
      draggingTouchStartTime: 0,
      draggingCurrentTime: 0,
      syncStatus: 0,
      showMoreMenuDialog: false,
      titleMarquee: null,
      isRefreshingUI: false
    }
  },
  watch: {
    showFullscreen(val) {
      this.updateScreenSize()
      this.$store.commit('setPlayerFullscreen', !!val)
      document.querySelector('body').style.backgroundColor = this.showFullscreen ? 'rgb(var(--color-bg))' : ''
    },
    bookCoverAspectRatio() {
      this.updateScreenSize()
    },
    title(val) {
      if (this.titleMarquee) this.titleMarquee.init(val)
    }
  },
  computed: {
    menuItems() {
      const items = []
      // TODO: Implement on iOS
      if (this.$platform !== 'ios' && !this.isPodcast && this.mediaId) {
        items.push({
          text: this.$strings.ButtonHistory,
          value: 'history',
          icon: 'history'
        })
      }

      items.push(
        ...[
          {
            text: this.$strings.LabelTotalTrack,
            value: 'total_track',
            icon: this.playerSettings.useTotalTrack ? 'check_box' : 'check_box_outline_blank'
          },
          {
            text: this.$strings.LabelChapterTrack,
            value: 'chapter_track',
            icon: this.playerSettings.useChapterTrack ? 'check_box' : 'check_box_outline_blank'
          },
          {
            text: this.$strings.LabelScaleElapsedTimeBySpeed,
            value: 'scale_elapsed_time',
            icon: this.playerSettings.scaleElapsedTimeBySpeed ? 'check_box' : 'check_box_outline_blank'
          },
          {
            text: this.playerSettings.lockUi ? this.$strings.LabelUnlockPlayer : this.$strings.LabelLockPlayer,
            value: 'lock',
            icon: this.playerSettings.lockUi ? 'lock' : 'lock_open'
          },
          {
            text: this.$strings.LabelClosePlayer,
            value: 'close',
            icon: 'close'
          }
        ]
      )

      return items
    },
    jumpForwardLabel() {
      return this.getJumpLabel(this.jumpForwardTime)
    },
    jumpBackwardsLabel() {
      return this.getJumpLabel(this.jumpBackwardsTime)
    },
    jumpForwardTime() {
      return this.$store.getters['getJumpForwardTime']
    },
    jumpBackwardsTime() {
      return this.$store.getters['getJumpBackwardsTime']
    },
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio']
    },
    bookCoverWidth() {
      if (this.showFullscreen) return this.fullscreenBookCoverWidth
      return 46 / this.bookCoverAspectRatio
    },
    fullscreenBookCoverWidth() {
      if (this.windowWidth < this.windowHeight) {
        // Portrait
        const maxWidth = this.bookCoverAspectRatio === 1 ? 320 : 270
        const availableHeight = this.windowHeight - 480
        let width = Math.min(this.windowWidth - 48, maxWidth)
        const totalHeight = width * this.bookCoverAspectRatio
        if (totalHeight > availableHeight) {
          width = availableHeight / this.bookCoverAspectRatio
        }
        return width
      } else {
        // Landscape
        const heightScale = (this.windowHeight - 200) / 651
        if (this.bookCoverAspectRatio === 1) {
          return 260 * heightScale
        }
        return 190 * heightScale
      }
    },
    showLoadingState() {
      return this.isLoading || this.isCheckingServerProgress
    },
    isProgressAnimating() {
      return this.isPlaying && !this.showLoadingState
    },
    trackBufferedProgress() {
      return Math.max(this.readyProgress, this.bufferedProgress)
    },
    totalTrackBufferedProgress() {
      return Math.max(this.totalReadyProgress, this.totalBufferedProgress)
    },
    trackCursorLeft() {
      return this.trackProgress * this.trackWidth - 14
    },
    showCastBtn() {
      return this.$store.state.isCastAvailable
    },
    isCasting() {
      return this.mediaPlayer === 'cast-player'
    },
    mediaPlayer() {
      return this.playbackSession?.mediaPlayer || null
    },
    mediaType() {
      return this.playbackSession?.mediaType || null
    },
    isPodcast() {
      return this.mediaType === 'podcast'
    },
    mediaMetadata() {
      return this.playbackSession?.mediaMetadata || null
    },
    libraryItem() {
      return this.playbackSession?.libraryItem || null
    },
    localLibraryItem() {
      return this.playbackSession?.localLibraryItem || null
    },
    localLibraryItemCoverSrc() {
      var localItemCover = this.localLibraryItem?.coverContentUrl || null
      if (localItemCover) return Capacitor.convertFileSrc(localItemCover)
      return null
    },
    playMethod() {
      return this.playbackSession?.playMethod || 0
    },
    isLocalPlayMethod() {
      return this.playMethod == this.$constants.PlayMethod.LOCAL
    },
    isDirectPlayMethod() {
      return this.playMethod == this.$constants.PlayMethod.DIRECTPLAY
    },
    title() {
      const mediaItemTitle = this.playbackSession?.displayTitle || this.mediaMetadata?.title || 'Title'
      if (this.currentChapterTitle) {
        if (this.showFullscreen) return this.currentChapterTitle
        return `${mediaItemTitle} | ${this.currentChapterTitle}`
      }
      return mediaItemTitle
    },
    authorName() {
      if (this.playbackSession) return this.playbackSession.displayAuthor
      return this.mediaMetadata?.authorName || 'Author'
    },
    chapters() {
      return this.playbackSession?.chapters || []
    },
    currentChapter() {
      if (!this.chapters.length) return null
      return this.chapters.find((ch) => Number(Number(ch.start).toFixed(2)) <= this.currentTime && Number(Number(ch.end).toFixed(2)) > this.currentTime)
    },
    nextChapter() {
      if (!this.chapters.length) return
      return this.chapters.find((c) => Number(Number(c.start).toFixed(2)) > this.currentTime)
    },
    currentChapterTitle() {
      return this.currentChapter?.title || ''
    },
    currentChapterDuration() {
      return this.currentChapter ? this.currentChapter.end - this.currentChapter.start : this.totalDuration
    },
    totalDurationPretty() {
      return this.$secondsToTimestamp(this.totalDuration)
    },
    currentTimePretty() {
      let currentTimeToUse = this.isDraggingCursor ? this.draggingCurrentTime : this.currentTime
      if (this.playerSettings.scaleElapsedTimeBySpeed) {
        currentTimeToUse = currentTimeToUse / this.currentPlaybackRate
      }
      return this.$secondsToTimestamp(currentTimeToUse)
    },
    timeRemaining() {
      let currentTimeToUse = this.isDraggingCursor ? this.draggingCurrentTime : this.currentTime
      if (this.playerSettings.useChapterTrack && this.currentChapter) {
        var currChapTime = currentTimeToUse - this.currentChapter.start
        return (this.currentChapterDuration - currChapTime) / this.currentPlaybackRate
      }
      return this.totalTimeRemaining
    },
    totalTimeRemaining() {
      let currentTimeToUse = this.isDraggingCursor ? this.draggingCurrentTime : this.currentTime
      return (this.totalDuration - currentTimeToUse) / this.currentPlaybackRate
    },
    totalTimeRemainingPretty() {
      if (this.totalTimeRemaining < 0) {
        return this.$secondsToTimestamp(this.totalTimeRemaining * -1)
      }
      return '-' + this.$secondsToTimestamp(this.totalTimeRemaining)
    },
    timeRemainingPretty() {
      if (this.timeRemaining < 0) {
        return this.$secondsToTimestamp(this.timeRemaining * -1)
      }
      return '-' + this.$secondsToTimestamp(this.timeRemaining)
    },
    sleepTimeRemainingPretty() {
      if (!this.sleepTimeRemaining) return '0s'
      var secondsRemaining = Math.round(this.sleepTimeRemaining)
      if (secondsRemaining > 91) {
        return Math.ceil(secondsRemaining / 60) + 'm'
      } else {
        return secondsRemaining + 's'
      }
    },
    socketConnected() {
      return this.$store.state.socketConnected
    },
    mediaId() {
      if (this.isPodcast || !this.playbackSession) return null
      if (this.playbackSession.libraryItemId) {
        return this.playbackSession.episodeId ? `${this.playbackSession.libraryItemId}-${this.playbackSession.episodeId}` : this.playbackSession.libraryItemId
      }
      const localLibraryItem = this.playbackSession.localLibraryItem
      if (!localLibraryItem) return null

      return this.playbackSession.localEpisodeId ? `${localLibraryItem.id}-${this.playbackSession.localEpisodeId}` : localLibraryItem.id
    }
  },
  methods: {
    showSyncsFailedDialog() {
      Dialog.alert({
        title: this.$strings.HeaderProgressSyncFailed,
        message: this.$strings.MessageProgressSyncFailed,
        cancelText: this.$strings.ButtonOk
      })
    },
    clickChaptersBtn() {
      if (!this.chapters.length) return
      this.showChapterModal = true
    },
    clickTitleAndAuthor() {
      if (!this.showFullscreen) return
      const llid = this.serverLibraryItemId || this.libraryItem?.id || this.localLibraryItem?.id
      if (llid) {
        this.$router.push(`/item/${llid}`)
        this.showFullscreen = false
      }
    },
    async selectChapter(chapter) {
      await this.$hapticsImpact()
      this.seek(chapter.start)
      this.showChapterModal = false
    },
    async castClick() {
      await this.$hapticsImpact()
      if (this.isLocalPlayMethod) {
        this.$eventBus.$emit('cast-local-item')
        return
      }
      AbsAudioPlayer.requestSession()
    },
    clickContainer() {
      this.expandToFullscreen()
    },
    expandToFullscreen() {
      this.showFullscreen = true
      if (this.titleMarquee) this.titleMarquee.reset()

      // Update track for total time bar if useChapterTrack is set
      this.$nextTick(() => {
        this.initializeTitleMarquee()
        this.updateTrack()
      })
    },
    collapseFullscreen() {
      this.showFullscreen = false
      if (this.titleMarquee) this.titleMarquee.reset()

      this.forceCloseDropdownMenu()
      this.$nextTick(() => {
        this.initializeTitleMarquee()
        if (this.$refs.track) this.trackWidth = this.$refs.track.clientWidth
      })
    },
    initializeTitleMarquee() {
      if (!this.$refs.titlewrapper) return
      if (this.titleMarquee) this.titleMarquee.reset()
      this.titleMarquee = new WrappingMarquee(this.$refs.titlewrapper)
      this.titleMarquee.init(this.title)
    },
    async jumpNextChapter() {
      await this.$hapticsImpact()
      if (this.showLoadingState) return
      if (!this.nextChapter) return
      this.seek(this.nextChapter.start)
    },
    async jumpChapterStart() {
      await this.$hapticsImpact()
      if (this.showLoadingState) return
      if (!this.currentChapter) {
        return this.restart()
      }

      // If 4 seconds or less into current chapter, then go to previous
      if (this.currentTime - this.currentChapter.start <= 4) {
        const currChapterIndex = this.chapters.findIndex((ch) => Number(ch.start) <= this.currentTime && Number(ch.end) >= this.currentTime)
        if (currChapterIndex > 0) {
          const prevChapter = this.chapters[currChapterIndex - 1]
          this.seek(prevChapter.start)
        }
      } else {
        this.seek(this.currentChapter.start)
      }
    },
    showSleepTimerModal() {
      this.$emit('showSleepTimer')
    },
    async setPlaybackSpeed(speed) {
      console.log(`[AudioPlayer] Set Playback Rate: ${speed}`)
      this.currentPlaybackRate = speed
      this.updateTimestamp()
      AbsAudioPlayer.setPlaybackSpeed({ value: speed })
    },
    restart() {
      this.seek(0)
    },
    async jumpBackwards() {
      await this.$hapticsImpact()
      if (this.showLoadingState) return
      AbsAudioPlayer.seekBackward({ value: this.jumpBackwardsTime })
    },
    async jumpForward() {
      await this.$hapticsImpact()
      if (this.showLoadingState) return
      AbsAudioPlayer.seekForward({ value: this.jumpForwardTime })
    },
    setStreamReady() {
      this.readyTrackWidth = this.trackWidth
      this.updateReadyTrack()
    },
    setChunksReady(chunks, numSegments) {
      let largestSeg = 0
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        if (typeof chunk === 'string') {
          const chunkRange = chunk.split('-').map((c) => Number(c))
          if (chunkRange.length < 2) continue
          if (chunkRange[1] > largestSeg) largestSeg = chunkRange[1]
        } else if (chunk > largestSeg) {
          largestSeg = chunk
        }
      }
      const percentageReady = largestSeg / numSegments
      const widthReady = Math.round(this.trackWidth * percentageReady)
      if (this.readyTrackWidth === widthReady) {
        return
      }
      this.readyTrackWidth = widthReady
      this.updateReadyTrack()
    },
    updateReadyTrack() {
      const readyProgress = this.trackWidth ? this.readyTrackWidth / this.trackWidth : 0
      this.totalReadyProgress = Math.min(1, Math.max(0, readyProgress))
      this.readyProgress = this.playerSettings.useChapterTrack ? 1 : this.totalReadyProgress
    },
    updateTimestamp() {
      const ts = this.$refs.currentTimestamp
      if (!ts) {
        console.error('No timestamp el')
        return
      }

      let currentTime = this.isDraggingCursor ? this.draggingCurrentTime : this.currentTime
      if (this.playerSettings.useChapterTrack && this.currentChapter) {
        currentTime = Math.max(0, currentTime - this.currentChapter.start)
      }
      if (this.playerSettings.scaleElapsedTimeBySpeed) {
        currentTime = currentTime / this.currentPlaybackRate
      }

      ts.innerText = this.$secondsToTimestamp(currentTime)
    },
    timeupdate() {
      this.$emit('updateTime', this.currentTime)

      if (this.seekLoading) {
        this.seekLoading = false
      }

      this.updateTimestamp()
      this.updateTrack()
    },
    updateTrack() {
      // Update progress track UI
      let currentTimeToUse = this.isDraggingCursor ? this.draggingCurrentTime : this.currentTime
      let percentDone = currentTimeToUse / this.totalDuration
      const totalPercentDone = percentDone
      let bufferedPercent = this.bufferedTime / this.totalDuration
      const totalBufferedPercent = bufferedPercent

      if (this.playerSettings.useChapterTrack && this.currentChapter) {
        const currChapTime = currentTimeToUse - this.currentChapter.start
        percentDone = currChapTime / this.currentChapterDuration
        bufferedPercent = Math.max(0, Math.min(1, (this.bufferedTime - this.currentChapter.start) / this.currentChapterDuration))
      }

      this.trackProgress = Math.min(1, Math.max(0, percentDone))
      this.bufferedProgress = Math.min(1, Math.max(0, bufferedPercent))
      this.totalTrackProgress = Math.min(1, Math.max(0, totalPercentDone))
      this.totalBufferedProgress = Math.min(1, Math.max(0, totalBufferedPercent))
    },
    seek(time) {
      if (this.showLoadingState) return
      if (this.seekLoading) {
        console.error('Already seek loading', this.seekedTime)
        return
      }

      this.seekedTime = time
      this.seekLoading = true

      AbsAudioPlayer.seek({ value: Math.floor(time) })

      this.totalTrackProgress = Math.min(1, Math.max(0, time / this.totalDuration))
      if (this.playerSettings.useChapterTrack && this.currentChapter) {
        this.trackProgress = Math.min(1, Math.max(0, (time - this.currentChapter.start) / this.currentChapterDuration))
      } else {
        this.trackProgress = this.totalTrackProgress
      }
    },
    async touchstartCursor(e) {
      if (!e || !e.touches || !this.$refs.track || !this.showFullscreen || this.playerSettings.lockUi) return

      await this.$hapticsImpact()
      this.isDraggingCursor = true
      this.draggingTouchStartX = e.touches[0].pageX
      this.draggingTouchStartTime = this.currentTime
      this.draggingCurrentTime = this.currentTime
      this.updateTrack()
    },
    async playPauseClick() {
      await this.$hapticsImpact()
      if (this.showLoadingState) return

      this.isPlaying = !!((await AbsAudioPlayer.playPause()) || {}).playing
      this.isEnded = false
    },
    setIsCheckingServerProgress(value) {
      this.isCheckingServerProgress = !!value
    },
    play() {
      AbsAudioPlayer.playPlayer()
      this.startPlayInterval()
      this.isPlaying = true
    },
    pause() {
      AbsAudioPlayer.pausePlayer()
      this.stopPlayInterval()
      this.isPlaying = false
    },
    startPlayInterval() {
      clearInterval(this.playInterval)
      this.playInterval = setInterval(async () => {
        var data = await AbsAudioPlayer.getCurrentTime()
        this.currentTime = Number(data.value.toFixed(2))
        this.bufferedTime = Number(data.bufferedTime.toFixed(2))
        this.timeupdate()
      }, 1000)
    },
    stopPlayInterval() {
      clearInterval(this.playInterval)
    },
    resetStream(startTime) {
      this.closePlayback()
    },
    touchstart(e) {
      if (!e.changedTouches || this.$store.state.globals.isModalOpen) return
      const touchPosY = e.changedTouches[0].pageY
      // when minimized only listen to touchstart on the player
      if (!this.showFullscreen && touchPosY < window.innerHeight - 120) return

      // for ios
      if (!this.showFullscreen && e.pageX < 20) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }

      this.touchStartY = touchPosY
      this.touchStartTime = Date.now()
    },
    touchend(e) {
      if (!e.changedTouches) return
      const touchDuration = Date.now() - this.touchStartTime
      const touchEndY = e.changedTouches[0].pageY
      const touchDistanceY = touchEndY - this.touchStartY

      // reset touch start data
      this.touchStartTime = 0
      this.touchStartY = 0

      if (this.isDraggingCursor) {
        if (this.draggingCurrentTime !== this.currentTime) {
          this.seek(this.draggingCurrentTime)
        }
        this.isDraggingCursor = false
      } else {
        if (touchDuration > 1200) {
          // console.log('touch too long', touchDuration)
          return
        }
        if (this.showFullscreen) {
          // Touch start higher than touchend
          if (touchDistanceY > 100) {
            this.collapseFullscreen()
          }
        } else if (touchDistanceY < -100) {
          this.expandToFullscreen()
        }
      }
    },
    touchmove(e) {
      if (!this.isDraggingCursor || !e.touches) return

      const distanceMoved = e.touches[0].pageX - this.draggingTouchStartX
      let duration = this.totalDuration
      let minTime = 0
      let maxTime = duration
      if (this.playerSettings.useChapterTrack && this.currentChapter) {
        duration = this.currentChapterDuration
        minTime = this.currentChapter.start
        maxTime = minTime + duration
      }

      const timePerPixel = duration / this.trackWidth
      const newTime = this.draggingTouchStartTime + timePerPixel * distanceMoved
      this.draggingCurrentTime = Math.min(maxTime, Math.max(minTime, newTime))

      this.updateTimestamp()
      this.updateTrack()
    },
    async clickMenuAction(action) {
      await this.$hapticsImpact()
      this.showMoreMenuDialog = false
      this.$nextTick(() => {
        if (action === 'history') {
          this.$router.push(`/media/${this.mediaId}/history?title=${this.title}`)
          this.showFullscreen = false
        } else if (action === 'scale_elapsed_time') {
          this.playerSettings.scaleElapsedTimeBySpeed = !this.playerSettings.scaleElapsedTimeBySpeed
          this.updateTimestamp()
          this.savePlayerSettings()
        } else if (action === 'lock') {
          this.playerSettings.lockUi = !this.playerSettings.lockUi
          this.savePlayerSettings()
        } else if (action === 'chapter_track') {
          this.playerSettings.useChapterTrack = !this.playerSettings.useChapterTrack
          this.playerSettings.useTotalTrack = !this.playerSettings.useChapterTrack || this.playerSettings.useTotalTrack

          this.updateTimestamp()
          this.updateTrack()
          this.updateReadyTrack()
          this.updateUseChapterTrack()
          this.savePlayerSettings()
        } else if (action === 'total_track') {
          this.playerSettings.useTotalTrack = !this.playerSettings.useTotalTrack
          this.playerSettings.useChapterTrack = !this.playerSettings.useTotalTrack || this.playerSettings.useChapterTrack

          this.updateTimestamp()
          this.updateTrack()
          this.updateReadyTrack()
          this.updateUseChapterTrack()
          this.savePlayerSettings()
        } else if (action === 'close') {
          this.closePlayback()
        }
      })
    },
    updateUseChapterTrack() {
      // Chapter track in NowPlaying only supported on iOS for now
      if (this.$platform === 'ios') {
        AbsAudioPlayer.setChapterTrack({ enabled: this.playerSettings.useChapterTrack })
      }
    },
    forceCloseDropdownMenu() {
      if (this.$refs.dropdownMenu && this.$refs.dropdownMenu.closeMenu) {
        this.$refs.dropdownMenu.closeMenu()
      }
    },
    closePlayback() {
      this.endPlayback()
      AbsAudioPlayer.closePlayback()
    },
    endPlayback() {
      this.$store.commit('setPlaybackSession', null)
      this.showFullscreen = false
      this.isEnded = false
      this.isLoading = false
      this.playbackSession = null
    },
    async loadPlayerSettings() {
      const savedPlayerSettings = await this.$localStore.getPlayerSettings()
      if (!savedPlayerSettings) {
        // In 0.9.72-beta 'useChapterTrack', 'useTotalTrack' and 'playerLock' was replaced with 'playerSettings' JSON object
        // Check if this old key was set and if so migrate them over to 'playerSettings'
        const chapterTrackPref = await this.$localStore.getPreferenceByKey('useChapterTrack')
        if (chapterTrackPref) {
          this.playerSettings.useChapterTrack = chapterTrackPref === '1'
          const totalTrackPref = await this.$localStore.getPreferenceByKey('useTotalTrack')
          this.playerSettings.useTotalTrack = totalTrackPref === '1'
          const playerLockPref = await this.$localStore.getPreferenceByKey('playerLock')
          this.playerSettings.lockUi = playerLockPref === '1'
        }
        this.savePlayerSettings()
      } else {
        this.playerSettings.useChapterTrack = !!savedPlayerSettings.useChapterTrack
        this.playerSettings.useTotalTrack = !!savedPlayerSettings.useTotalTrack
        this.playerSettings.lockUi = !!savedPlayerSettings.lockUi
        this.playerSettings.scaleElapsedTimeBySpeed = !!savedPlayerSettings.scaleElapsedTimeBySpeed
      }
    },
    savePlayerSettings() {
      return this.$localStore.setPlayerSettings({ ...this.playerSettings })
    },
    //
    // Listeners from audio AbsAudioPlayer
    //
    onPlayingUpdate(data) {
      console.log('onPlayingUpdate', JSON.stringify(data))
      this.isPlaying = !!data.value
      this.$store.commit('setPlayerPlaying', this.isPlaying)
      if (this.isPlaying) {
        this.startPlayInterval()
      } else {
        this.stopPlayInterval()
      }
    },
    onMetadata(data) {
      console.log('onMetadata', JSON.stringify(data))
      this.totalDuration = Number(data.duration.toFixed(2))
      this.currentTime = Number(data.currentTime.toFixed(2))

      // Done loading
      if (data.playerState !== 'BUFFERING' && data.playerState !== 'IDLE') {
        this.isLoading = false
      }

      if (data.playerState === 'ENDED') {
        console.log('[AudioPlayer] Playback ended')
      }
      this.isEnded = data.playerState === 'ENDED'

      console.log('received metadata update', data)

      this.timeupdate()
    },
    // When a playback session is started the native android/ios will send the session
    onPlaybackSession(playbackSession) {
      console.log('onPlaybackSession received', JSON.stringify(playbackSession))
      this.playbackSession = playbackSession

      this.isEnded = false
      this.isLoading = true
      this.syncStatus = 0
      this.$store.commit('setPlaybackSession', this.playbackSession)

      // Set track width
      this.$nextTick(() => {
        this.initializeTitleMarquee()

        if (this.$refs.track) {
          this.trackWidth = this.$refs.track.clientWidth
        } else {
          console.error('Track not loaded', this.$refs)
        }
      })
    },
    onPlaybackClosed() {
      this.endPlayback()
    },
    onPlaybackFailed(data) {
      console.log('Received onPlaybackFailed evt')
      var errorMessage = data.value || 'Unknown Error'
      this.$toast.error(`Playback Failed: ${errorMessage}`)
      this.endPlayback()
    },
    onPlaybackSpeedChanged(data) {
      if (!data.value || isNaN(data.value)) return
      this.currentPlaybackRate = Number(data.value)
      this.updateTimestamp()
    },
    async init() {
      await this.loadPlayerSettings()

      AbsAudioPlayer.addListener('onPlaybackSession', this.onPlaybackSession)
      AbsAudioPlayer.addListener('onPlaybackClosed', this.onPlaybackClosed)
      AbsAudioPlayer.addListener('onPlaybackFailed', this.onPlaybackFailed)
      AbsAudioPlayer.addListener('onPlayingUpdate', this.onPlayingUpdate)
      AbsAudioPlayer.addListener('onMetadata', this.onMetadata)
      AbsAudioPlayer.addListener('onProgressSyncFailing', this.showProgressSyncIsFailing)
      AbsAudioPlayer.addListener('onProgressSyncSuccess', this.showProgressSyncSuccess)
      AbsAudioPlayer.addListener('onPlaybackSpeedChanged', this.onPlaybackSpeedChanged)
    },
    async screenOrientationChange() {
      if (this.isRefreshingUI) return
      this.isRefreshingUI = true
      const windowWidth = window.innerWidth
      this.refreshUI()

      // Window width does not always change right away. Wait up to 250ms for a change.
      // iPhone 10 on iOS 16 took between 100 - 200ms to update when going from portrait to landscape
      //   but landscape to portrait was immediate
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        if (window.innerWidth !== windowWidth) {
          this.refreshUI()
          break
        }
      }

      this.isRefreshingUI = false
    },
    refreshUI() {
      this.updateScreenSize()
      if (this.$refs.track) {
        this.trackWidth = this.$refs.track.clientWidth
        this.updateTrack()
        this.updateReadyTrack()
      }
    },
    updateScreenSize() {
      setTimeout(() => {
        if (this.titleMarquee) this.titleMarquee.init(this.title)
      }, 500)

      this.windowHeight = window.innerHeight
      this.windowWidth = window.innerWidth
      const coverHeight = this.fullscreenBookCoverWidth * this.bookCoverAspectRatio
      const coverImageWidthCollapsed = 46 / this.bookCoverAspectRatio
      const titleAuthorLeftOffsetCollapsed = 30 + coverImageWidthCollapsed
      const titleAuthorWidthCollapsed = this.windowWidth - 128 - titleAuthorLeftOffsetCollapsed - 10

      document.documentElement.style.setProperty('--cover-image-width', this.fullscreenBookCoverWidth + 'px')
      document.documentElement.style.setProperty('--cover-image-height', coverHeight + 'px')
      document.documentElement.style.setProperty('--cover-image-width-collapsed', coverImageWidthCollapsed + 'px')
      document.documentElement.style.setProperty('--cover-image-height-collapsed', 46 + 'px')
      document.documentElement.style.setProperty('--title-author-left-offset-collapsed', titleAuthorLeftOffsetCollapsed + 'px')
      document.documentElement.style.setProperty('--title-author-width-collapsed', titleAuthorWidthCollapsed + 'px')
    },
    minimizePlayerEvt() {
      this.collapseFullscreen()
    },
    showProgressSyncIsFailing() {
      this.syncStatus = this.$constants.SyncStatus.FAILED
    },
    showProgressSyncSuccess() {
      this.syncStatus = this.$constants.SyncStatus.SUCCESS
    }
  },
  mounted() {
    this.updateScreenSize()
    if (screen.orientation) {
      // Not available on ios
      screen.orientation.addEventListener('change', this.screenOrientationChange)
    } else {
      document.addEventListener('orientationchange', this.screenOrientationChange)
    }
    window.addEventListener('resize', this.screenOrientationChange)

    this.$eventBus.$on('minimize-player', this.minimizePlayerEvt)
    document.body.addEventListener('touchstart', this.touchstart, { passive: false })
    document.body.addEventListener('touchend', this.touchend)
    document.body.addEventListener('touchmove', this.touchmove)
    this.$nextTick(this.init)
  },
  beforeDestroy() {
    if (screen.orientation) {
      // Not available on ios
      screen.orientation.removeEventListener('change', this.screenOrientationChange)
    } else {
      document.removeEventListener('orientationchange', this.screenOrientationChange)
    }
    window.removeEventListener('resize', this.screenOrientationChange)

    if (this.playbackSession) {
      console.log('[AudioPlayer] Before destroy closing playback')
      this.closePlayback()
    }

    this.forceCloseDropdownMenu()
    this.$eventBus.$off('minimize-player', this.minimizePlayerEvt)
    document.body.removeEventListener('touchstart', this.touchstart)
    document.body.removeEventListener('touchend', this.touchend)
    document.body.removeEventListener('touchmove', this.touchmove)

    if (AbsAudioPlayer.removeAllListeners) {
      AbsAudioPlayer.removeAllListeners()
    }
    clearInterval(this.playInterval)
  }
}
</script>

<style>
:root {
  --cover-image-width: 0px;
  --cover-image-height: 0px;
  --cover-image-width-collapsed: 46px;
  --cover-image-height-collapsed: 46px;
  --title-author-left-offset-collapsed: 80px;
  --title-author-width-collapsed: 40%;
}

.playerContainer {
  height: 120px;
}
.fullscreen .playerContainer {
  height: 200px;
}
#playerContent {
  box-shadow: 0px -8px 8px #11111155;
}
.fullscreen #playerContent {
  left: 12px;
  right: 12px;
  bottom: 12px;
  width: auto;
  overflow: hidden;
  border: 1px solid rgb(var(--color-border) / 0.96);
  border-radius: 28px;
  background: linear-gradient(145deg, rgb(var(--color-secondary) / 0.58), rgb(var(--color-bg) / 0.38));
  box-shadow: 0 18px 48px rgb(0 0 0 / 0.38), inset 0 1px 0 rgb(var(--color-fg) / 0.11), inset 0 -1px 0 rgb(var(--color-accent) / 0.08);
  backdrop-filter: blur(var(--glass-float-blur)) saturate(var(--glass-float-saturate));
  -webkit-backdrop-filter: blur(var(--glass-float-blur)) saturate(var(--glass-float-saturate));
}

.terminal-player-bg {
  background:
    radial-gradient(circle at 18% 28%, rgb(var(--color-success) / 0.12), transparent 34%),
    radial-gradient(circle at 84% 56%, rgb(var(--color-accent) / 0.1), transparent 42%),
    linear-gradient(180deg, rgb(var(--color-bg) / 0.4), rgb(var(--color-bg) / 0.58));
  backdrop-filter: blur(var(--glass-float-blur)) saturate(var(--glass-float-saturate));
  -webkit-backdrop-filter: blur(var(--glass-float-blur)) saturate(var(--glass-float-saturate));
}

.nightglass-full-header {
  top: 10px;
  left: 12px;
  right: 12px;
  height: 56px;
  padding: 4px;
  overflow: hidden;
  border: 1px solid rgb(var(--color-border) / 0.95);
  border-radius: 20px;
  background: linear-gradient(110deg, rgb(var(--color-secondary) / 0.58), rgb(var(--color-bg) / 0.34));
  box-shadow: 0 12px 30px rgb(0 0 0 / 0.28), inset 0 1px 0 rgb(var(--color-fg) / 0.12);
  backdrop-filter: blur(var(--glass-float-blur)) saturate(var(--glass-float-saturate));
  -webkit-backdrop-filter: blur(var(--glass-float-blur)) saturate(var(--glass-float-saturate));
}
.nightglass-full-header::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(135deg, rgb(var(--color-fg) / 0.06), transparent 42%, rgb(var(--color-accent) / 0.08));
}
.nightglass-full-header__control {
  border-radius: 15px;
  background: rgb(var(--color-bg) / 0.16);
  transition: color 180ms ease, background 180ms ease, transform 180ms ease;
}
.nightglass-full-header__control:active {
  transform: scale(0.94);
  background: rgb(var(--color-fg) / 0.1);
}
.nightglass-full-header__status {
  pointer-events: none;
}
.nightglass-player-accent-rail {
  top: 82px;
  bottom: 224px;
  left: 12px;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgb(var(--color-success)), rgb(var(--color-accent) / 0.3));
  box-shadow: 0 0 14px rgb(var(--color-success) / 0.5);
}

#playerTrack {
  transition: all 0.15s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: margin;
  bottom: 35px;
}
.fullscreen #playerTrack {
  bottom: unset;
}

.cover-wrapper {
  bottom: 68px;
  left: 24px;
  height: var(--cover-image-height-collapsed);
  width: var(--cover-image-width-collapsed);
  transition: all 0.25s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: left, bottom, width, height;
  transform-origin: left bottom;
  border-radius: 3px;
  overflow: hidden;
}

.total-track {
  bottom: 224px;
  left: 12px;
  right: 12px;
  width: auto;
  padding: 10px 16px;
  border: 1px solid rgb(var(--color-border) / 0.88);
  border-radius: 18px;
  background: linear-gradient(120deg, rgb(var(--color-secondary) / 0.48), rgb(var(--color-bg) / 0.3));
  box-shadow: 0 10px 26px rgb(0 0 0 / 0.25), inset 0 1px 0 rgb(var(--color-fg) / 0.08);
  backdrop-filter: blur(var(--glass-shelf-blur)) saturate(var(--glass-shelf-saturate));
  -webkit-backdrop-filter: blur(var(--glass-shelf-blur)) saturate(var(--glass-shelf-saturate));
}

.title-author-texts {
  transition: all 0.15s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: left, bottom, width, height;
  transform-origin: left bottom;

  width: var(--title-author-width-collapsed);
  bottom: 76px;
  left: var(--title-author-left-offset-collapsed);
  text-align: left;
}
.title-author-texts .title-text {
  transition: all 0.15s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: font-size;
  font-size: 0.85rem;
  line-height: 1.5;
}
.title-author-texts .author-text {
  transition: all 0.15s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: font-size;
  font-size: 0.75rem;
  line-height: 1.2;
}

.fullscreen .title-author-texts {
  bottom: calc(50% - var(--cover-image-height) / 2 + 50px);
  width: 80%;
  left: 10%;
  text-align: center;
  padding: 10px 16px;
  pointer-events: auto;
}
.terminal-title-panel {
  background: linear-gradient(90deg, rgb(var(--color-secondary) / 0.56), rgb(var(--color-bg) / 0.4));
  border: 1px solid rgb(var(--color-border) / 0.92);
  border-left: 2px solid rgb(var(--color-success));
  border-radius: 18px;
  box-shadow: 0 12px 30px rgb(0 0 0 / 0.25), inset 0 1px 0 rgb(var(--color-fg) / 0.09);
  backdrop-filter: blur(var(--glass-shelf-blur)) saturate(var(--glass-shelf-saturate));
  -webkit-backdrop-filter: blur(var(--glass-shelf-blur)) saturate(var(--glass-shelf-saturate));
}
.fullscreen .title-author-texts .title-text {
  font-size: clamp(0.8rem, calc(var(--cover-image-height) / 260 * 20), 1.3rem);
}
.fullscreen .title-author-texts .author-text {
  font-size: clamp(0.6rem, calc(var(--cover-image-height) / 260 * 16), 1rem);
}

#playerControls {
  transition: all 0.15s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: width, bottom;
  width: 128px;
  padding-right: 24px;
  bottom: 70px;
}
#playerControls .jump-icon {
  transition: all 0.15s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: font-size;

  margin: 0px 0px;
  font-size: 1.6rem;
}
#playerControls .jump-label {
  margin-top: 2px;
}
#playerControls .play-btn {
  transition: all 0.15s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: padding, margin, height, width, min-width, min-height;

  height: 40px;
  width: 40px;
  min-width: 40px;
  min-height: 40px;
  margin: 0px 7px;
}
#playerControls .play-btn .material-symbols {
  transition: all 0.15s cubic-bezier(0.39, 0.575, 0.565, 1);
  transition-property: font-size;

  font-size: 1.5rem;
}
#playerControls .play-btn .ph-icon {
  height: 1.5rem;
  width: 1.5rem;
}

.fullscreen .cover-wrapper {
  margin: 0 auto;
  height: var(--cover-image-height);
  width: var(--cover-image-width);
  left: calc(50% - (calc(var(--cover-image-width)) / 2));
  bottom: calc(50% + 120px - (calc(var(--cover-image-height)) / 2));
  border-radius: 24px;
  overflow: hidden;
}
.terminal-cover {
  border: 1px solid rgb(var(--color-fg) / 0.42);
  box-shadow: 0 18px 46px rgb(0 0 0 / 0.34), 0 0 0 1px rgb(var(--color-success) / 0.2), inset 0 1px 0 rgb(var(--color-fg) / 0.12);
}
.nightglass-mini-player {
  position: absolute;
  z-index: 20;
  left: 12px;
  right: 12px;
  bottom: 12px;
  height: 114px;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 148px;
  grid-template-rows: 56px 36px;
  column-gap: 10px;
  row-gap: 4px;
  padding: 10px 10px 8px;
  overflow: hidden;
  border: 1px solid rgb(var(--color-border) / 0.95);
  border-radius: 20px;
  background: linear-gradient(135deg, rgb(var(--color-secondary) / 0.44), rgb(var(--color-bg) / 0.3));
  box-shadow: 0 14px 34px rgb(0 0 0 / 0.42), inset 0 1px 0 rgb(var(--color-fg) / 0.09);
  backdrop-filter: blur(var(--glass-float-blur)) saturate(var(--glass-float-saturate));
  -webkit-backdrop-filter: blur(var(--glass-float-blur)) saturate(var(--glass-float-saturate));
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease, background 260ms ease, box-shadow 260ms ease;
}
.nightglass-mini-player::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(135deg, rgb(var(--color-fg) / 0.06), transparent 44%, rgb(var(--color-accent) / 0.08));
}
.nightglass-mini-player__cover {
  grid-column: 1;
  grid-row: 1;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  overflow: hidden;
  border: 1px solid rgb(var(--color-border));
  border-radius: 12px;
  background: rgb(var(--color-bg) / 0.45);
}
.nightglass-mini-player__metadata {
  grid-column: 2;
  grid-row: 1;
  min-height: 48px;
  align-self: center;
  overflow: hidden;
}
.nightglass-mini-player__controls {
  grid-column: 3;
  grid-row: 1;
  display: grid;
  grid-template-columns: repeat(3, 48px);
  column-gap: 2px;
  align-self: center;
  justify-self: end;
}
.nightglass-mini-player__track {
  grid-column: 2 / 4;
  grid-row: 2;
  min-width: 0;
  overflow: hidden;
  align-self: stretch;
}
.terminal-play-btn {
  border: 1px solid rgb(var(--color-success) / 0.55) !important;
  border-radius: 20px !important;
  background: linear-gradient(145deg, rgb(var(--color-success) / 0.16), rgb(var(--color-bg) / 0.48)) !important;
  box-shadow: 0 10px 24px rgb(0 0 0 / 0.3), inset 0 1px 0 rgb(var(--color-fg) / 0.12), 0 0 18px rgb(var(--color-success) / 0.1) !important;
}

.nightglass-player-actions {
  position: relative;
  min-height: 52px;
  padding: 2px 6px;
  border: 1px solid rgb(var(--color-border) / 0.62);
  border-top-color: transparent;
  border-radius: 18px;
  background: rgb(var(--color-bg) / 0.16);
  box-shadow: inset 0 -1px 0 rgb(var(--color-accent) / 0.035);
}
.nightglass-player-actions__notch {
  position: absolute;
  top: -1px;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 24px;
  overflow: visible;
  pointer-events: none;
}
.nightglass-player-actions__notch path {
  fill: none;
  stroke: rgb(var(--color-border) / 0.72);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.nightglass-player-actions > button,
.nightglass-player-actions > span {
  position: relative;
  z-index: 1;
}
.nightglass-player-actions > button {
  border-radius: 14px;
  transition: color 180ms ease, background 180ms ease, transform 180ms ease;
}
.nightglass-player-actions > button:active {
  transform: scale(0.94);
  background: rgb(var(--color-fg) / 0.08);
}
.synthwave-playhead {
  width: 3px;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent 0%, rgb(var(--color-success)) 18%, rgb(var(--color-info)) 50%, rgb(var(--color-accent)) 82%, transparent 100%);
  box-shadow: 0 0 7px rgb(4 209 249 / 0.72), 0 0 13px rgb(55 244 153 / 0.2);
}

.fullscreen #playerControls {
  width: 100%;
  padding-left: 24px;
  padding-right: 24px;
  bottom: 78px;
  left: 0;
}
.fullscreen #playerControls .jump-icon {
  font-size: 2.4rem;
  border: 1px solid rgb(var(--color-border) / 0.5);
  border-radius: 16px;
  background: rgb(var(--color-bg) / 0.14);
}
.fullscreen #playerControls .next-icon {
  font-size: 2rem;
  border-radius: 16px;
  background: rgb(var(--color-bg) / 0.14);
}
.fullscreen #playerControls .next-icon .ph-icon {
  height: 2rem;
  width: 2rem;
}
.fullscreen #playerControls .play-btn {
  height: 65px;
  width: 65px;
  min-width: 65px;
  min-height: 65px;
}
.fullscreen #playerControls .play-btn .material-symbols {
  font-size: 2.1rem;
}
.fullscreen #playerControls .play-btn .ph-icon {
  height: 2.1rem;
  width: 2.1rem;
}
</style>
