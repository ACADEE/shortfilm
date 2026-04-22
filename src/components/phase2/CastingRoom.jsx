import { useStudioStore } from '@/store/studioStore'
import ImageGrid from './ImageGrid'
import ValidatePhase2 from './ValidatePhase2'

export default function CastingRoom({ projectId }) {
  const { phase1Complete, phase2Complete } = useStudioStore()

  return (
    <div className="flex flex-col gap-5 p-5 h-full overflow-y-auto relative">
      <div>
        <p className="text-xs text-duan-red uppercase tracking-widest font-semibold mb-0.5">Phase 2</p>
        <h2 className="text-white font-bold text-lg">Casting & Locations</h2>
        <p className="text-xs text-studio-muted mt-1">AI-generated reference images for each character and location</p>
      </div>

      {!phase1Complete ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3 opacity-20">🔒</div>
            <p className="text-studio-muted text-sm">Complete Phase 1 first</p>
          </div>
        </div>
      ) : (
        <>
          {projectId && <ImageGrid projectId={projectId} />}
          {projectId && <ValidatePhase2 projectId={projectId} />}
        </>
      )}

      {/* Locked overlay when phase 2 done */}
      {phase2Complete && (
        <div className="absolute inset-0 bg-studio-panel/80 backdrop-blur-sm flex items-center justify-center pointer-events-none rounded">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 font-semibold">Casting Approved</p>
          </div>
        </div>
      )}
    </div>
  )
}
