export function toneFromState({ attempting, networkConnected, socketConnected }) {
  if (attempting) return 'syncing'
  if (!networkConnected) return 'offline'
  if (!socketConnected) return 'degraded'
  return 'online'
}
