import { useStudioStore } from '@/store/studioStore'
import { useFirestoreSnapshot } from '@/hooks/useFirestoreSnapshot'
import { charactersCol, locationsCol } from '@/firebase/firestore'

export default function ValidatePhase2({ projectId }) {
  const { phase1Complete, phase2Complete, advancePhase } = useStudioStore()

  const { docs: characters } = useFirestoreSnapshot(
    phase1Complete && !phase2Complete ? charactersCol(projectId) : null
  )
  const { docs: locations } = useFirestoreSnapshot(
    phase1Complete && !phase2Complete ? locationsCol(projectId) : null
  )

  if (!phase1Complete || phase2Complete) return null

  const allItems = [...characters, ...locations]
  const totalItems = allItems.length
  const readyItems = allItems.filter((i) => i.status === 'ready').length
  const allReady = totalItems > 0 && readyItems === totalItems

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${allReady ? 'border-green-900/50 bg-green-900/10' : 'border-studio-border bg-studio-card'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Casting progress</p>
          <p className="text-xs text-studio-muted">{readyItems} / {totalItems} images ready</p>
        </div>
        <div className="text-right">
          <div className="w-24 h-1.5 bg-studio-border rounded-full overflow-hidden">
            <div
              className="h-full bg-duan-red rounded-full transition-all"
              style={{ width: totalItems > 0 ? `${(readyItems / totalItems) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => advancePhase(2)}
        disabled={!allReady}
        className="w-full bg-green-700 hover:bg-green-600 disabled:bg-studio-card disabled:text-studio-muted text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
      >
        {allReady ? 'Approve Casting → Start Filming' : `Waiting for ${totalItems - readyItems} image(s)…`}
      </button>
    </div>
  )
}
