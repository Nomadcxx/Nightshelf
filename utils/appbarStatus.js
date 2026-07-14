export const ROUTE_LABELS = {
  index: 'HOME',
  bookshelf: 'HOME',
  'bookshelf-library': 'LIBRARY',
  'bookshelf-series': 'SERIES',
  'bookshelf-series-id': 'SERIES',
  'bookshelf-collections': 'COLLECTIONS',
  'bookshelf-playlists': 'PLAYLISTS',
  'bookshelf-authors': 'AUTHORS',
  'bookshelf-latest': 'LATEST',
  search: 'SEARCH',
  settings: 'SETTINGS',
  connect: 'CONNECT',
  account: 'ACCOUNT',
  stats: 'STATS',
  downloads: 'DOWNLOADS',
  downloading: 'DOWNLOADS',
  logs: 'LOGS'
}

export const THEME_LABELS = {
  night: 'NIGHT',
  terminal: 'TERMINAL',
  black: 'BLACK'
}

/**
 * Short mono token for an active library filter (e.g. genres.Science Fiction → SF).
 */
export function filterShortCode(filterBy) {
  if (!filterBy || filterBy === 'all') return ''

  const dot = filterBy.indexOf('.')
  if (dot === -1) return filterBy.slice(0, 4).toUpperCase()

  const type = filterBy.slice(0, dot)
  let token = ''
  try {
    token = decodeURIComponent(filterBy.slice(dot + 1))
  } catch {
    token = filterBy.slice(dot + 1)
  }

  if (!token) return type.slice(0, 3).toUpperCase()

  const words = token.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return words
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4)
  }

  if (token.length <= 4) return token.toUpperCase()
  return token.slice(0, 4).toUpperCase()
}

export function statusLabel({ routeName, theme, filterBy }) {
  const section = ROUTE_LABELS[routeName] || 'NIGHTSHELF'
  const themeLabel = THEME_LABELS[theme] || String(theme || 'night').toUpperCase()
  let status = `${section} · ${themeLabel}`

  if (routeName === 'bookshelf-library' && filterBy && filterBy !== 'all') {
    const code = filterShortCode(filterBy)
    if (code) status = `${status} · FILTER · ${code}`
  }

  return status
}
