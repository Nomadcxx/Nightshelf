export function normalizeViewMode(mode) {
  return mode === 'grid' ? 'grid' : 'rails'
}

export function toggleViewMode(mode) {
  return normalizeViewMode(mode) === 'rails' ? 'grid' : 'rails'
}
