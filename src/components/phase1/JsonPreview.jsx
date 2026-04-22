import { useStudioStore } from '@/store/studioStore'

function highlight(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)"(\s*):(\s*)/g, '<span class="text-blue-300">"$1"</span>$2:$3')
    .replace(/: "([^"]*)"/g, ': <span class="text-green-300">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="text-yellow-300">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="text-purple-300">$1</span>')
}

export default function JsonPreview() {
  const { parsedScript, streamingDone } = useStudioStore()

  if (!parsedScript || !streamingDone) return null

  const json = JSON.stringify(parsedScript, null, 2)

  return (
    <div className="rounded-lg border border-green-900/50 bg-studio-bg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-studio-border bg-studio-card">
        <span className="text-xs text-green-400 font-mono">✓ script.json — parsed</span>
        <span className="ml-auto text-xs text-studio-muted">
          {parsedScript.season_arc?.length || 0} episodes · {parsedScript.characters?.length || 0} characters · {parsedScript.locations?.length || 0} locations
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="bg-studio-card rounded p-3 border border-studio-border">
          <p className="text-xs text-studio-muted mb-1">Series Title</p>
          <p className="text-white font-semibold">{parsedScript.title}</p>
        </div>
        <div className="bg-studio-card rounded p-3 border border-studio-border">
          <p className="text-xs text-studio-muted mb-1">Synopsis</p>
          <p className="text-sm text-gray-300">{parsedScript.global_synopsis}</p>
        </div>
        <div className="bg-studio-card rounded p-3 border border-studio-border">
          <p className="text-xs text-studio-muted mb-1">Recurring Motif</p>
          <p className="text-sm text-duan-red">{parsedScript.recurrent_motif}</p>
        </div>
        <div className="bg-studio-card rounded p-3 border border-studio-border">
          <p className="text-xs text-studio-muted mb-2">Season Arc ({parsedScript.season_arc?.length} episodes)</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {parsedScript.season_arc?.map((ep, i) => (
              <div key={i} className="flex gap-2 text-xs">
                <span className="text-studio-muted w-8 shrink-0">Ep {i + 1}</span>
                <span className="text-gray-300">{ep}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
