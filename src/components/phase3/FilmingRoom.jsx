import { useEffect, useRef } from 'react'
import { useStudioStore } from '@/store/studioStore'
import { useFirestoreSnapshot } from '@/hooks/useFirestoreSnapshot'
import { plansCol, charactersCol } from '@/firebase/firestore'
import { callFunction } from '@/utils/callFunction'
import VideoPlayer from './VideoPlayer'
import ProgressBar from './ProgressBar'
import PlanList from './PlanList'
import ExportZip from './ExportZip'

export default function FilmingRoom({ projectId }) {
  const { phase2Complete, setVideoJob, setError, currentEpId: EP_ID } = useStudioStore()
  const jobsStarted = useRef(false)

  const { docs: plans } = useFirestoreSnapshot(
    phase2Complete && projectId ? plansCol(projectId, EP_ID) : null,
    'plan_number'
  )

  const { docs: characters } = useFirestoreSnapshot(
    phase2Complete && projectId ? charactersCol(projectId) : null
  )
  const heroImage =
    characters.find((c) => c.role === 'Hero' && c.reference_image_url)?.reference_image_url ||
    characters.find((c) => c.reference_image_url)?.reference_image_url ||
    null

  // Reset the guard when the active episode changes so new episodes auto-start
  useEffect(() => {
    jobsStarted.current = false
  }, [EP_ID])

  // Start video generation for all pending plans once phase 2 is approved
  useEffect(() => {
    if (!phase2Complete || !projectId || jobsStarted.current) return
    if (plans.length === 0) return

    const pendingPlans = plans.filter((p) => p.status === 'pending' && !p.kie_task_id)
    if (pendingPlans.length === 0) return

    jobsStarted.current = true

    async function startVideoJobs() {
      for (const plan of pendingPlans) {
        try {
          setVideoJob(plan.id, { status: 'queued' })
          const result = await callFunction('generateVideo', {
            videoMotionPrompt: plan.video_motion_prompt,
            imagePromptOverride: plan.image_prompt_override,
            referenceImageUrl: plan.reference_image_url || heroImage,
            planId: plan.id,
            epId: EP_ID,
            projectId,
          })
          setVideoJob(plan.id, { taskId: result.taskId, status: 'queued' })
        } catch (err) {
          setVideoJob(plan.id, { status: 'error' })
          setError(err.message)
        }
      }
    }

    startVideoJobs()
  }, [phase2Complete, projectId, EP_ID, plans.length])

  return (
    <div className="flex flex-col gap-5 p-5 h-full overflow-y-auto">
      <div>
        <p className="text-xs text-duan-red uppercase tracking-widest font-semibold mb-0.5">Phase 3</p>
        <h2 className="text-white font-bold text-lg">Filming & Editing</h2>
        <p className="text-xs text-studio-muted mt-1">AI-animated clips appear as they complete</p>
      </div>

      {!phase2Complete ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3 opacity-20">🔒</div>
            <p className="text-studio-muted text-sm">Complete Phase 2 first</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {projectId && <VideoPlayer projectId={projectId} epId={EP_ID} />}
          {projectId && <ProgressBar projectId={projectId} epId={EP_ID} />}
          {projectId && <ExportZip projectId={projectId} epId={EP_ID} />}
          <div>
            <h3 className="text-xs text-studio-muted uppercase tracking-widest mb-3">Plans</h3>
            {projectId && <PlanList projectId={projectId} epId={EP_ID} />}
          </div>
        </div>
      )}
    </div>
  )
}
