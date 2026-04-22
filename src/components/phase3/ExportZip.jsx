import { useState } from 'react'
import { useStudioStore } from '@/store/studioStore'
import { useFirestoreSnapshot } from '@/hooks/useFirestoreSnapshot'
import { plansCol } from '@/firebase/firestore'
import { callFunction } from '@/utils/callFunction'
import Spinner from '@/components/shared/Spinner'

export default function ExportZip({ projectId, epId }) {
  const { setError } = useStudioStore()
  const [loading, setLoading] = useState(false)

  const { docs: plans } = useFirestoreSnapshot(
    projectId && epId ? plansCol(projectId, epId) : null
  )

  const readyCount = plans.filter((p) => p.mp4_url).length
  const hasAny = readyCount > 0

  async function handleExport() {
    setLoading(true)
    try {
      const { zipUrl } = await callFunction('exportZip', { projectId, epId })
      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `episode_01.zip`
      a.click()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!hasAny) return null

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 bg-studio-card border border-studio-border hover:border-duan-red text-white font-medium py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
    >
      {loading ? (
        <>
          <Spinner size={16} />
          Preparing ZIP…
        </>
      ) : (
        <>
          <span>↓</span>
          Export ZIP ({readyCount} clips)
        </>
      )}
    </button>
  )
}
