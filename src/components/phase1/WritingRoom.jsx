import { useStudioStore } from '@/store/studioStore'
import IdeaForm from './IdeaForm'
import ScriptStream from './ScriptStream'
import JsonPreview from './JsonPreview'
import ValidatePhase1 from './ValidatePhase1'

export default function WritingRoom() {
  const { phase1Complete, parsedScript, isStreaming, reset } = useStudioStore()

  const plans = parsedScript?.episode_1?.plans || []
  const totalDuration = plans.length * 2

  return (
    <div className="flex flex-col gap-5 p-5 h-full overflow-y-auto">
      {/* Column header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-duan-red uppercase tracking-widest font-semibold mb-0.5">Phase 1</p>
          <h2 className="text-white font-bold text-lg leading-tight">Salle d'Écriture</h2>
          <p className="text-xs text-studio-muted mt-1">Transformez votre idée en 30 épisodes</p>
        </div>

        {/* New project button — only when a project exists and not streaming */}
        {(phase1Complete || parsedScript) && !isStreaming && (
          <button
            onClick={() => {
              if (window.confirm('Créer un nouveau projet ? Le projet actuel sera réinitialisé.')) {
                reset()
              }
            }}
            className="text-xs text-studio-muted hover:text-white border border-studio-border hover:border-studio-muted px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            + Nouveau
          </button>
        )}
      </div>

      {/* Phase 1 done stats banner */}
      {phase1Complete && parsedScript && (
        <div className="rounded-lg bg-green-950/40 border border-green-900/50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Script validé</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-white font-bold text-lg">{parsedScript.season_arc?.length || 0}</p>
              <p className="text-xs text-studio-muted">épisodes</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{plans.length}</p>
              <p className="text-xs text-studio-muted">plans Ép.1</p>
            </div>
            <div>
              <p className="text-white font-bold text-lg">{totalDuration}s</p>
              <p className="text-xs text-studio-muted">durée Ép.1</p>
            </div>
          </div>
        </div>
      )}

      {/* Input form — hidden once phase 1 is complete */}
      {!phase1Complete && <IdeaForm />}

      {/* Live streaming terminal */}
      <ScriptStream />

      {/* Parsed JSON preview with full details */}
      <JsonPreview />

      {/* Validate button */}
      <ValidatePhase1 />
    </div>
  )
}
