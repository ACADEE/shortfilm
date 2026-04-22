import { useState } from 'react'
import { useStudioStore } from '@/store/studioStore'

const PHASE_COLORS = {
  Hook:    'text-duan-red bg-duan-red/10 border-duan-red/30',
  Context: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  Escalade:'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  Twist:   'text-purple-400 bg-purple-400/10 border-purple-400/30',
}

const ROLE_COLORS = {
  Hero:       'text-green-400',
  Antagonist: 'text-red-400',
  Secondary:  'text-blue-400',
  Narrator:   'text-purple-400',
}

function Section({ title, count, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded border border-studio-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-studio-card hover:bg-studio-border/40 transition-colors"
      >
        <span className="text-xs font-semibold text-studio-muted uppercase tracking-widest">{title}</span>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <span className="text-xs bg-studio-border px-2 py-0.5 rounded-full text-studio-muted">{count}</span>
          )}
          <span className="text-studio-muted text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && <div className="p-3 bg-studio-bg space-y-2">{children}</div>}
    </div>
  )
}

export default function JsonPreview() {
  const { parsedScript, streamingDone } = useStudioStore()

  if (!parsedScript || !streamingDone) return null

  const plans = parsedScript.episode_1?.plans || []
  const totalDuration = plans.length * 2

  return (
    <div className="rounded-lg border border-green-900/40 bg-studio-bg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-studio-border bg-studio-card">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-none" />
        <span className="text-xs text-green-400 font-mono font-semibold">script.json — validated</span>
        <span className="ml-auto text-xs text-studio-muted">
          {parsedScript.season_arc?.length || 0} ep · {parsedScript.characters?.length || 0} chars · {parsedScript.locations?.length || 0} locs · {plans.length} plans
        </span>
      </div>

      <div className="p-3 space-y-2">
        {/* Series identity */}
        <div className="bg-studio-card rounded border border-studio-border p-3 space-y-2">
          <p className="text-white font-bold text-base leading-tight">{parsedScript.title}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{parsedScript.global_synopsis}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-studio-muted">Motif récurrent</span>
            <span className="text-xs text-duan-red font-medium">→ {parsedScript.recurrent_motif}</span>
          </div>
        </div>

        {/* Season arc */}
        <Section title="Arc saison" count={`${parsedScript.season_arc?.length || 0} épisodes`}>
          <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1">
            {parsedScript.season_arc?.map((ep, i) => (
              <div key={i} className="flex gap-2 text-xs py-0.5 border-b border-studio-border/40 last:border-0">
                <span className="text-studio-muted w-10 shrink-0 font-mono">Ep {String(i + 1).padStart(2, '0')}</span>
                <span className="text-gray-300">{ep}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Characters */}
        <Section title="Personnages" count={parsedScript.characters?.length} defaultOpen>
          {parsedScript.characters?.map((char) => (
            <div key={char.name} className="flex items-start gap-2 py-1 border-b border-studio-border/40 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-studio-muted mt-1.5 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{char.name}</span>
                  <span className={`text-xs font-medium ${ROLE_COLORS[char.role] || 'text-gray-400'}`}>
                    {char.role}
                  </span>
                </div>
                <p className="text-xs text-studio-muted mt-0.5 leading-relaxed line-clamp-2">{char.image_prompt}</p>
              </div>
            </div>
          ))}
        </Section>

        {/* Locations */}
        <Section title="Décors" count={parsedScript.locations?.length} defaultOpen>
          {parsedScript.locations?.map((loc) => (
            <div key={loc.name} className="flex items-start gap-2 py-1 border-b border-studio-border/40 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 mt-1.5 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white">{loc.name}</span>
                <p className="text-xs text-studio-muted mt-0.5 leading-relaxed line-clamp-2">{loc.image_prompt}</p>
              </div>
            </div>
          ))}
        </Section>

        {/* Episode 1 */}
        <Section title={`Épisode 1 — ${parsedScript.episode_1?.metadata?.title || ''}`} count={`${totalDuration}s`} defaultOpen>
          {parsedScript.episode_1?.metadata && (
            <div className="space-y-1.5 mb-3 pb-3 border-b border-studio-border">
              <div>
                <span className="text-xs text-studio-muted">Tension : </span>
                <span className="text-xs text-gray-300">{parsedScript.episode_1.metadata.tension_goal}</span>
              </div>
              <div>
                <span className="text-xs text-studio-muted">Cliffhanger : </span>
                <span className="text-xs text-duan-red">{parsedScript.episode_1.metadata.cliffhanger}</span>
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {plans.map((plan) => (
              <div
                key={plan.plan_number}
                className="flex gap-2 text-xs rounded border border-studio-border/60 bg-studio-card p-2"
              >
                {/* Plan number */}
                <span className="font-mono text-studio-muted w-6 shrink-0 pt-0.5">
                  {String(plan.plan_number).padStart(2, '0')}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PHASE_COLORS[plan.narrative_phase] || 'text-gray-400 bg-studio-border border-studio-border'}`}>
                      {plan.narrative_phase}
                    </span>
                    <span className="text-studio-muted">{plan.duration_seconds}s</span>
                    {plan.video_motion_prompt && (
                      <span className="text-purple-400/70 font-mono text-xs truncate max-w-32">{plan.video_motion_prompt}</span>
                    )}
                  </div>
                  <p className="text-gray-300 leading-relaxed">{plan.visual_action}</p>
                  {plan.subtitles && (
                    <p className="text-yellow-300/80 font-medium">"{plan.subtitles}"</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
