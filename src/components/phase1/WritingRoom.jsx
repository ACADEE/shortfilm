import IdeaForm from './IdeaForm'
import ScriptStream from './ScriptStream'
import JsonPreview from './JsonPreview'
import ValidatePhase1 from './ValidatePhase1'

export default function WritingRoom() {
  return (
    <div className="flex flex-col gap-5 p-5 h-full overflow-y-auto">
      <div>
        <p className="text-xs text-duan-red uppercase tracking-widest font-semibold mb-0.5">Phase 1</p>
        <h2 className="text-white font-bold text-lg">Writing Room</h2>
        <p className="text-xs text-studio-muted mt-1">Turn your idea into a 30-episode script</p>
      </div>

      <IdeaForm />
      <ScriptStream />
      <JsonPreview />
      <ValidatePhase1 />
    </div>
  )
}
