export function planLabel(n) {
  return `Plan ${String(n).padStart(2, '0')}`
}

export function formatDuration(seconds) {
  return `${seconds}s`
}

export function narrativePhaseColor(phase) {
  const map = {
    Hook: 'text-duan-red',
    Context: 'text-blue-400',
    Escalade: 'text-yellow-400',
    Twist: 'text-purple-400',
  }
  return map[phase] || 'text-gray-400'
}

export function truncate(str, n = 60) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}
