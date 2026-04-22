import { useEffect } from 'react'
import { useStudioStore } from '@/store/studioStore'
import { useFirestoreSnapshot } from '@/hooks/useFirestoreSnapshot'
import { charactersCol, locationsCol } from '@/firebase/firestore'
import { callFunction } from '@/utils/callFunction'
import ImageCard from './ImageCard'
import Spinner from '@/components/shared/Spinner'

export default function ImageGrid({ projectId }) {
  const { setImageJob, setError, phase1Complete } = useStudioStore()

  const { docs: characters, loading: charsLoading } = useFirestoreSnapshot(
    phase1Complete ? charactersCol(projectId) : null
  )
  const { docs: locations, loading: locsLoading } = useFirestoreSnapshot(
    phase1Complete ? locationsCol(projectId) : null
  )

  // Auto-start generation for pending items when phase 1 completes
  useEffect(() => {
    if (!phase1Complete || !projectId) return

    async function startPendingJobs(items, type) {
      for (const item of items) {
        if (item.status === 'pending' && !item.kie_task_id) {
          try {
            setImageJob(item.id, { status: 'queued' })
            const result = await callFunction('generateImage', {
              imagePrompt: item.image_prompt,
              itemId: item.id,
              itemType: type,
              projectId,
            })
            setImageJob(item.id, { taskId: result.taskId, status: 'queued' })
          } catch (err) {
            setImageJob(item.id, { status: 'error' })
            setError(err.message)
          }
        }
      }
    }

    if (characters.length > 0) startPendingJobs(characters, 'character')
    if (locations.length > 0) startPendingJobs(locations, 'location')
  }, [phase1Complete, characters.length, locations.length, projectId])

  if (charsLoading || locsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} color="#e8233a" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {characters.length > 0 && (
        <div>
          <h3 className="text-xs text-studio-muted uppercase tracking-widest mb-3">
            Cast ({characters.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {characters.map((char) => (
              <ImageCard key={char.id} item={char} type="character" projectId={projectId} />
            ))}
          </div>
        </div>
      )}

      {locations.length > 0 && (
        <div>
          <h3 className="text-xs text-studio-muted uppercase tracking-widest mb-3">
            Locations ({locations.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {locations.map((loc) => (
              <ImageCard key={loc.id} item={loc} type="location" projectId={projectId} />
            ))}
          </div>
        </div>
      )}

      {characters.length === 0 && locations.length === 0 && (
        <p className="text-center text-studio-muted text-sm py-8">No characters or locations found.</p>
      )}
    </div>
  )
}
