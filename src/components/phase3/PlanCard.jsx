import { useStudioStore } from '@/store/studioStore'
import { useVideoPolling } from '@/hooks/useVideoPolling'
import { callFunction } from '@/utils/callFunction'
import Spinner from '@/components/shared/Spinner'
import StatusBadge from '@/components/shared/StatusBadge'
import { planLabel, narrativePhaseColor, truncate } from '@/utils/formatters'

export default function PlanCard({ plan, projectId, epId }) {
  const { setVideoJob, videoJobs, setError } = useStudioStore()
  const job = videoJobs[plan.id] || {}
  const taskId = job.taskId || plan.kie_task_id
  const status = plan.mp4_url ? 'ready' : taskId ? (job.status || plan.status || 'queued') : (plan.status || 'pending')

  useVideoPolling({
    taskId,
    projectId,
    planId: plan.id,
    epId,
    enabled: !!taskId && status !== 'ready' && status !== 'error',
  })

  async function handleRetry() {
    try {
      setVideoJob(plan.id, { status: 'queued' })
      const result = await callFunction('generateVideo', {
        videoMotionPrompt: plan.video_motion_prompt,
        imagePromptOverride: plan.image_prompt_override,
        referenceImageUrl: plan.reference_image_url,
        planId: plan.id,
        epId,
        projectId,
      })
      setVideoJob(plan.id, { taskId: result.taskId, status: 'queued' })
    } catch (err) {
      setVideoJob(plan.id, { status: 'error' })
      setError(err.message)
    }
  }

  return (
    <div className={`flex gap-3 p-3 rounded-lg border transition-colors ${
      status === 'ready' ? 'border-green-900/40 bg-green-900/5' :
      status === 'error' ? 'border-red-900/40 bg-red-900/5' :
      'border-studio-border bg-studio-card'
    }`}>
      {/* Thumbnail */}
      <div className="w-10 shrink-0" style={{ aspectRatio: '9/16' }}>
        {plan.mp4_url ? (
          <video
            src={plan.mp4_url}
            className="w-full h-full object-cover rounded"
            preload="metadata"
            muted
          />
        ) : (
          <div className="w-full h-full bg-studio-bg rounded flex items-center justify-center">
            {(status === 'queued' || status === 'processing') ? (
              <Spinner size={14} color="#e8233a" />
            ) : (
              <span className="text-xs text-studio-muted">{plan.plan_number}</span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white font-mono">{planLabel(plan.plan_number)}</span>
          <span className={`text-xs font-medium ${narrativePhaseColor(plan.narrative_phase)}`}>
            {plan.narrative_phase}
          </span>
          <div className="ml-auto">
            <StatusBadge status={status} />
          </div>
        </div>
        <p className="text-xs text-studio-muted truncate">{truncate(plan.visual_action, 70)}</p>
        {plan.subtitles && (
          <p className="text-xs text-white/60 italic">"{plan.subtitles}"</p>
        )}
        {status === 'error' && (
          <button
            onClick={handleRetry}
            className="text-xs text-duan-red hover:text-white transition-colors"
          >
            Retry ↺
          </button>
        )}
      </div>
    </div>
  )
}
