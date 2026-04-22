import { useFirestoreSnapshot } from '@/hooks/useFirestoreSnapshot'
import { plansCol } from '@/firebase/firestore'

export default function ProgressBar({ projectId, epId }) {
  const { docs: plans } = useFirestoreSnapshot(
    projectId && epId ? plansCol(projectId, epId) : null
  )

  const total = plans.length
  const ready = plans.filter((p) => p.status === 'ready' || p.mp4_url).length
  const errors = plans.filter((p) => p.status === 'error').length
  const pct = total > 0 ? Math.round((ready / total) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-studio-muted">
        <span>{ready} / {total} clips ready</span>
        {errors > 0 && <span className="text-red-400">{errors} error(s)</span>}
        <span>{pct}%</span>
      </div>
      <div className="w-full h-1.5 bg-studio-border rounded-full overflow-hidden">
        <div
          className="h-full bg-duan-red rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
