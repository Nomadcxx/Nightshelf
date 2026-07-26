export const MOTION_PREFERENCES = ['SYSTEM', 'FULL', 'REDUCED']

export const MOTION_PREFERENCE_DEFAULT = 'SYSTEM'

/**
 * Coerce a stored or user-supplied value into a supported preference.
 * Anything unrecognised falls back to SYSTEM so a corrupt persisted value
 * can never leave the app without a usable motion setting.
 */
export function normalizeMotionPreference(value) {
  if (typeof value !== 'string') return MOTION_PREFERENCE_DEFAULT
  const upper = value.trim().toUpperCase()
  return MOTION_PREFERENCES.includes(upper) ? upper : MOTION_PREFERENCE_DEFAULT
}

/**
 * Combine the app preference with the operating system's reduced-motion
 * request into the single value the UI applies: 'full' or 'reduced'.
 *
 * An OS reduced-motion request always wins, including over an explicit FULL.
 * That is deliberate: reduced motion is an accessibility signal, not a taste
 * setting, so the app never overrides it.
 */
export function resolveMotionMode(preference, osPrefersReduced) {
  const normalized = normalizeMotionPreference(preference)
  if (normalized === 'REDUCED') return 'reduced'
  return osPrefersReduced ? 'reduced' : 'full'
}
