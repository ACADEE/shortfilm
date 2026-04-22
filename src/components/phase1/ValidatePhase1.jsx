import { useStudioStore } from '@/store/studioStore'

export default function ValidatePhase1() {
  const { streamingDone, parsedScript, phase1Complete, advancePhase } = useStudioStore()

  if (!streamingDone || !parsedScript || phase1Complete) return null

  return (
    <div className="rounded-lg border border-duan-red/30 bg-duan-red/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-duan-red text-lg">🎬</span>
        <div>
          <p className="text-sm font-medium text-white">Script ready</p>
          <p className="text-xs text-studio-muted">
            {parsedScript.episode_1?.plans?.length || 0} plans · {parsedScript.characters?.length || 0} characters · {parsedScript.locations?.length || 0} locations
          </p>
        </div>
      </div>
      <button
        onClick={() => advancePhase(1)}
        className="w-full bg-duan-red hover:bg-duan-red-dark text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
      >
        Validate Script → Start Casting
      </button>
    </div>
  )
}
