const STATUS_STYLES = {
  pending: 'bg-gray-700 text-gray-400',
  queued: 'bg-amber-900/40 text-amber-400',
  processing: 'bg-blue-900/40 text-blue-400 animate-pulse',
  ready: 'bg-green-900/40 text-green-400',
  error: 'bg-red-900/40 text-red-400',
}

const STATUS_LABELS = {
  pending: 'Pending',
  queued: 'Queued',
  processing: 'Processing…',
  ready: 'Ready',
  error: 'Error',
}

export default function StatusBadge({ status = 'pending' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
    >
      {status === 'ready' && <span>✓</span>}
      {status === 'error' && <span>✗</span>}
      {STATUS_LABELS[status] || status}
    </span>
  )
}
