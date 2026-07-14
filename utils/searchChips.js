export function visibleGroups(chip, groups) {
  const key = (chip || 'all').toLowerCase()
  if (key === 'all') return groups
  return groups.filter((g) => g === key)
}

export const SEARCH_CHIPS = ['all', 'books', 'podcasts', 'series', 'authors', 'narrators', 'tags']
