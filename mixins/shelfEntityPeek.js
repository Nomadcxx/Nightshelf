import { describeShelfEntity } from '@/utils/shelfEntityActions'
import { normalizeOriginRect } from '@/utils/libraryPeekSource'
import { coverTransitionName, runViewTransition } from '@/utils/viewTransition'

/**
 * Opens Peek for whatever entity a shelf card is holding.
 *
 * Cards implement `peekSource()`; everything else — measuring, describing,
 * publishing the session — happens here so the five card types cannot drift
 * apart in how they present themselves.
 *
 * The card contributes data only. It deliberately registers no callbacks,
 * because a virtualised shelf may destroy it while the overlay is still open.
 */
export default {
  created() {
    // Self-wiring: the press mixin emits on this same instance, so a template
    // v-on cannot catch it — that would listen for a DOM event of the same name.
    this.$on('press-commit', this.openPeek)
  },
  computed: {
    /**
     * Accessible name for the card.
     *
     * In grid and rail modes the card renders no text at all — the title only
     * appears in alt view — so without this a screen reader announces an
     * unlabelled button. Built from the same descriptor Peek uses, so the name
     * and the actions can never describe different things.
     */
    shelfCardLabel() {
      const descriptor = describeShelfEntity(this.peekSource())
      if (!descriptor) return ''
      return descriptor.subtitle ? `${descriptor.title}, ${descriptor.subtitle}` : descriptor.title
    }
  },
  methods: {
    /** Cards override this. Returns the input shape describeShelfEntity expects. */
    peekSource() {
      return null
    },
    /** Cards override this when the shelf supports selection or sits in a playlist. */
    peekContext() {
      return {}
    },
    /** Cards override this to supply the artwork the lifted cover should show. */
    peekCoverSrc() {
      return null
    },
    /** The element the lift animates from. Defaults to the card's root. */
    peekElement() {
      return this.$refs.card || this.$el
    },
    /**
     * Navigate with the pressed cover carrying across to the detail page.
     *
     * Only this card is named, and only for the duration of the navigation —
     * naming every cover would collide the moment the same book appears in two
     * rails. If the WebView has no view-transition support, or the transition
     * fails for any reason, the route change still happens.
     */
    navigateWithCoverContinuity(to, entityId) {
      const router = this.$router || this.$nuxt.$router
      if (!router) return

      const store = this.$store || this.$nuxt.$store
      const name = coverTransitionName(entityId)
      const el = this.peekElement()
      const reduced = store?.getters['globals/motionMode'] === 'reduced'

      if (!name || !el || reduced || typeof document === 'undefined') {
        router.push(to)
        return
      }

      el.style.viewTransitionName = name
      runViewTransition({
        doc: document,
        apply: () => router.push(to),
        cleanup: () => {
          // The card may have been recycled out from under us by now.
          if (el && el.style) el.style.viewTransitionName = ''
        }
      })
    },
    openPeek() {
      const source = this.peekSource()
      const descriptor = describeShelfEntity(source)
      // A card still waiting for its data has nothing to show; silently doing
      // nothing is better than an overlay describing an empty item.
      if (!descriptor) return

      const element = this.peekElement()
      if (!element || typeof element.getBoundingClientRect !== 'function') return
      const originRect = normalizeOriginRect(element.getBoundingClientRect())
      if (!originRect) return

      const store = this.$store || this.$nuxt.$store
      store.commit('globals/setPeekSession', {
        descriptor,
        source,
        context: {
          // Server-backed actions need both a configured server and a live
          // network, or they present buttons that can only fail.
          isConnectedToServer: !!store.getters['user/getServerAddress'] && !!store.state.networkConnected,
          ...this.peekContext()
        },
        coverSrc: this.peekCoverSrc(),
        originRect
      })
    }
  }
}
