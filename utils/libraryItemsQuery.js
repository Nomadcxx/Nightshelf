export function buildLibraryItemsQuery({
  filterBy = 'all',
  orderBy = null,
  orderDesc = false,
  collapseSeries = false,
  limit = 24,
  page = 0
} = {}) {
  const searchParams = new URLSearchParams()

  if (filterBy && filterBy !== 'all') searchParams.set('filter', filterBy)
  if (orderBy) {
    searchParams.set('sort', orderBy)
    searchParams.set('desc', orderDesc ? 1 : 0)
  }
  if (collapseSeries) searchParams.set('collapseseries', 1)

  searchParams.set('limit', limit)
  searchParams.set('page', page)
  searchParams.set('minified', 1)
  searchParams.set('include', 'rssfeed,numEpisodesIncomplete')

  return searchParams.toString()
}

export function getLibraryItemsTotal(payload) {
  if (!payload || !Array.isArray(payload.results)) return null
  const total = Number(payload.total)
  return Number.isFinite(total) && total >= 0 ? total : null
}
