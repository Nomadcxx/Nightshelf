function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch (_) {
    return value
  }
}

export function getActiveGenre(activeFilter) {
  if (!activeFilter || !activeFilter.startsWith('genres.')) return null
  return safeDecode(activeFilter.slice('genres.'.length)).trim() || null
}

export function selectQuickGenres(genres, activeFilter = 'all', limit = 12) {
  const uniqueGenres = []
  const seen = new Set()

  for (const value of Array.isArray(genres) ? genres : []) {
    const genre = String(value || '').trim()
    const key = genre.toLocaleLowerCase()
    if (!genre || seen.has(key)) continue
    seen.add(key)
    uniqueGenres.push(genre)
  }

  const activeGenre = getActiveGenre(activeFilter)
  const selected = []
  if (activeGenre) selected.push(activeGenre)

  const remaining = uniqueGenres.filter((genre) => genre.toLocaleLowerCase() !== activeGenre?.toLocaleLowerCase())
  const concise = remaining.filter((genre) => genre.length <= 32 && !/[,;]/.test(genre))
  const compound = remaining.filter((genre) => !concise.includes(genre))

  return [...selected, ...concise, ...compound].slice(0, Math.max(0, limit))
}
