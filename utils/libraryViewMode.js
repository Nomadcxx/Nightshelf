export function normalizeViewMode(mode) {
  return ['rails', 'grid', 'compact'].includes(mode) ? mode : 'rails'
}

export function toggleViewMode(mode) {
  const modes = ['rails', 'grid', 'compact']
  return modes[(modes.indexOf(normalizeViewMode(mode)) + 1) % modes.length]
}
