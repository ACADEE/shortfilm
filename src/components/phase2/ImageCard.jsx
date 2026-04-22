import { useState, useEffect } from 'react'
import { useStudioStore } from '@/store/studioStore'
import { useImagePolling } from '@/hooks/useImagePolling'
import { callFunction } from '@/utils/callFunction'
import Spinner from '@/components/shared/Spinner'
import StatusBadge from '@/components/shared/StatusBadge'

export default function ImageCard({ item, type, projectId }) {
  const { setImageJob, imageJobs, setError } = useStudioStore()
  const colName = type === 'location' ? 'locations' : 'characters'
  const job = imageJobs[item.id] || {}
  const firestoreStatus = item.status
  const taskId = job.taskId || item.kie_task_id

  // Derive effective status
  const status = item.reference_image_url ? 'ready'
    : taskId ? (job.status || firestoreStatus || 'queued')
    : (firestoreStatus || 'pending')

  // Polling — only when we have a taskId and not yet ready
  const { data: pollData } = useImagePolling({
    taskId,
    projectId,
    itemId: item.id,
    colName,
    enabled: !!taskId && status !== 'ready' && status !== 'error',
  })

  async function handleGenerate() {
    try {
      setImageJob(item.id, { status: 'queued' })
      const result = await callFunction('generateImage', {
        imagePrompt: item.image_prompt,
        itemId: item.id,
        itemType: type === 'location' ? 'location' : 'character',
        projectId,
      })
      setImageJob(item.id, { taskId: result.taskId, status: 'queued' })
    } catch (err) {
      setImageJob(item.id, { status: 'error' })
      setError(err.message)
    }
  }

  const imageUrl = item.reference_image_url || (pollData?.status === 'ready' ? pollData.url : null)
  const effectiveStatus = imageUrl ? 'ready' : status

  return (
    <div className="bg-studio-card border border-studio-border rounded-xl overflow-hidden">
      {/* Image area */}
      <div className="relative bg-studio-bg" style={{ aspectRatio: '9/16' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {(effectiveStatus === 'queued' || effectiveStatus === 'processing') ? (
              <div className="flex flex-col items-center gap-2">
                <Spinner size={32} color="#e8233a" />
                <span className="text-xs text-studio-muted">Generating…</span>
              </div>
            ) : (
              <div className="text-center p-4">
                <div className="text-4xl mb-2 opacity-20">{type === 'location' ? '🏙' : '👤'}</div>
                <p className="text-xs text-studio-muted">No image yet</p>
              </div>
            )}
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={effectiveStatus} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div>
          <p className="text-sm font-semibold text-white truncate">{item.name}</p>
          {item.role && <p className="text-xs text-studio-muted">{item.role}</p>}
        </div>
        <p className="text-xs text-studio-muted line-clamp-2">{item.image_prompt}</p>

        <div className="flex gap-2">
          {effectiveStatus === 'pending' || effectiveStatus === 'error' ? (
            <button
              onClick={handleGenerate}
              className="flex-1 text-xs bg-duan-red hover:bg-duan-red-dark text-white font-medium py-1.5 rounded-lg transition-colors"
            >
              {effectiveStatus === 'error' ? 'Retry' : 'Generate'}
            </button>
          ) : imageUrl ? (
            <button
              onClick={handleGenerate}
              className="flex-1 text-xs bg-studio-bg border border-studio-border hover:border-duan-red text-studio-muted hover:text-white py-1.5 rounded-lg transition-colors"
            >
              Regenerate
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
