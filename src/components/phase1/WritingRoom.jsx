import { useState } from 'react'
import { useStudioStore } from '@/store/studioStore'
import { useFirestoreSnapshot } from '@/hooks/useFirestoreSnapshot'
import { useEpisodeStream } from '@/hooks/useEpisodeStream'
import { episodesCol } from '@/firebase/firestore'
import IdeaForm from './IdeaForm'
import ScriptStream from './ScriptStream'
import JsonPreview from './JsonPreview'
import ValidatePhase1 from './ValidatePhase1'
import Spinner from '@/components/shared/Spinner'

function EpisodeList({ projectId, seasonArc }) {
  const { setCurrentEpId, currentEpId } = useStudioStore()
  const { startEpisodeStream, isStreaming, streamText } = useEpisodeStream()
  const [generatingEpNumber, setGeneratingEpNumber] = useState(null)

  const { docs: episodes } = useFirestoreSnapshot(
    projectId ? episodesCol(projectId) : null
  )

  const generatedEpIds = new Set(episodes.map((e) => e.epId))

  async function handleGenerate(epNumber) {
    setGeneratingEpNumber(epNumber)
    try {
      await startEpisodeStream({ epNumber })
    } finally {
      setGeneratingEpNumber(null)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-studio-muted uppercase tracking-widest">Épisodes suivants</p>

      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {seasonArc.slice(0, 30).map((hook, i) => {
          const epNumber = i + 1
          const epId = `ep_${String(epNumber).padStart(2, '0')}`
          const isDone = generatedEpIds.has(epId)
          const isActive = currentEpId === epId
          const prevEpId = `ep_${String(epNumber - 1).padStart(2, '0')}`
          const prevDone = epNumber === 1 || generatedEpIds.has(prevEpId)
          const isGeneratingThis = generatingEpNumber === epNumber

          return (
            <div
              key={epId}
              className={`flex items-start gap-2 p-2 rounded border text-xs transition-colors ${
                isActive
                  ? 'border-duan-red/50 bg-duan-red/5'
                  : 'border-studio-border bg-studio-card'
              }`}
            >
              <span className="text-studio-muted font-mono w-8 shrink-0 pt-0.5">
                {String(epNumber).padStart(2, '0')}
              </span>
              <p className="flex-1 text-gray-400 leading-relaxed line-clamp-2 min-w-0">{hook}</p>
              <div className="shrink-0 flex gap-1">
                {isDone ? (
                  <button
                    onClick={() => setCurrentEpId(epId)}
                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-duan-red text-white'
                        : 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                    }`}
                  >
                    {isActive ? '● Actif' : '✓ Ouvrir'}
                  </button>
                ) : isGeneratingThis ? (
                  <span className="flex items-center gap-1 text-studio-muted px-1">
                    <Spinner size={12} color="#e8233a" />
                  </span>
                ) : (
                  <button
                    onClick={() => handleGenerate(epNumber)}
                    disabled={!prevDone || isStreaming}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-studio-bg border border-studio-border text-studio-muted hover:border-duan-red hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Générer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Streaming terminal for episode generation */}
      {isStreaming && streamText && (
        <pre className="font-mono text-xs text-green-300 bg-studio-bg border border-studio-border rounded p-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
          {streamText}
          <span className="inline-block w-2 h-3 bg-green-400 animate-pulse ml-0.5 align-text-bottom" />
        </pre>
      )}
    </div>
  )
}

export default function WritingRoom() {
  const { phase1Complete, parsedScript, isStreaming, reset, projectId } = useStudioStore()

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

      {/* Episode list — shown after phase 1 validation */}
      {phase1Complete && parsedScript?.season_arc?.length > 0 && projectId && (
        <EpisodeList
          projectId={projectId}
          seasonArc={parsedScript.season_arc}
        />
      )}
    </div>
  )
}
