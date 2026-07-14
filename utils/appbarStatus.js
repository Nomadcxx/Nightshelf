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

export function statusLabel({ routeName, theme }) {
  const section = ROUTE_LABELS[routeName] || 'NIGHTSHELF'
  const themeLabel = String(theme || 'night').toUpperCase()
  return `${section} · ${themeLabel}`
}
