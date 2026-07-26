import Vue from "vue";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics"

const hapticsImpactHeavy = async () => {
  await Haptics.impact({ style: ImpactStyle.Heavy })
}
Vue.prototype.$hapticsImpactHeavy = hapticsImpactHeavy

const hapticsImpactMedium = async () => {
  await Haptics.impact({ style: ImpactStyle.Medium })
}
Vue.prototype.$hapticsImpactMedium = hapticsImpactMedium

const hapticsImpactLight = async () => {
  await Haptics.impact({ style: ImpactStyle.Light })
}
Vue.prototype.$hapticsImpactLight = hapticsImpactLight

const hapticsVibrate = async () => {
  await Haptics.vibrate()
}
Vue.prototype.$hapticsVibrate = hapticsVibrate

const hapticsNotificationSuccess = async () => {
  await Haptics.notification({ type: NotificationType.Success })
}
Vue.prototype.$hapticsNotificationSuccess = hapticsNotificationSuccess

const hapticsNotificationWarning = async () => {
  await Haptics.notification({ type: NotificationType.Warning })
}
Vue.prototype.$hapticsNotificationWarning = hapticsNotificationWarning

const hapticsNotificationError = async () => {
  await Haptics.notification({ type: NotificationType.Error })
}
Vue.prototype.$hapticsNotificationError = hapticsNotificationError

const hapticsSelectionStart = async () => {
  await Haptics.selectionStart()
}
Vue.prototype.$hapticsSelectionStart = hapticsSelectionStart

const hapticsSelectionChanged = async () => {
  await Haptics.selectionChanged()
}
Vue.prototype.$hapticsSelectionChanged = hapticsSelectionChanged

const hapticsSelectionEnd = async () => {
  await Haptics.selectionEnd()
}
Vue.prototype.$hapticsSelectionEnd = hapticsSelectionEnd

/**
 * Haptic feedback must never block or fail the action it accompanies. A device
 * without a vibrator, a revoked permission, or a Capacitor error all resolve
 * quietly instead of rejecting into the caller.
 */
const safeHaptic = async (fn) => {
  try {
    await fn()
  } catch (error) {
    console.warn('[haptics] feedback unavailable', error)
  }
}

export default ({ store }, inject) => {
  const strength = () => store.state.globals.hapticFeedback
  const enabled = () => strength() !== 'OFF'

  inject('hapticsImpact', () => {
    const hapticFeedback = strength()
    if (hapticFeedback === 'OFF') return
    if (hapticFeedback === 'LIGHT') return hapticsImpactLight()
    if (hapticFeedback === 'MEDIUM') return hapticsImpactMedium()
    return hapticsImpactHeavy()
  })

  // Semantic haptics: components request a *meaning*, never a raw strength, so
  // the mapping between intent and intensity lives in one place.

  // Fires once when a long press commits and Peek opens.
  //
  // This is the confirmation that a *hidden* gesture succeeded, so it has to be
  // unmistakable. An earlier version deliberately fired one step below the
  // user's setting, which at the default resolved to ImpactStyle.Light — a
  // ~10ms tick that tested as imperceptible on a Pixel. Medium is the floor.
  inject('hapticsLongPressCommit', () => {
    if (!enabled()) return
    return safeHaptic(strength() === 'HEAVY' ? hapticsImpactHeavy : hapticsImpactMedium)
  })

  // Ordinary tap-through to a detail page. Light on purpose: it accompanies a
  // visible result, so it only needs to confirm the touch registered.
  inject('hapticsTap', () => {
    if (!enabled()) return
    return safeHaptic(strength() === 'HEAVY' ? hapticsImpactMedium : hapticsImpactLight)
  })

  // Selection added or removed in batch-select mode.
  inject('hapticsSelectionChange', () => {
    if (!enabled()) return
    return safeHaptic(hapticsSelectionChanged)
  })

  // Playback actually starting or resuming — a more consequential outcome than
  // a selection, so it reads one step heavier.
  inject('hapticsPlaybackStart', () => {
    if (!enabled()) return
    return safeHaptic(strength() === 'LIGHT' ? hapticsImpactLight : strength() === 'HEAVY' ? hapticsImpactHeavy : hapticsImpactMedium)
  })

  // Destructive confirmation prompts.
  inject('hapticsActionWarning', () => {
    if (!enabled()) return
    return safeHaptic(hapticsNotificationWarning)
  })

  // An action that failed and left something for the user to resolve.
  inject('hapticsActionError', () => {
    if (!enabled()) return
    return safeHaptic(hapticsNotificationError)
  })
}