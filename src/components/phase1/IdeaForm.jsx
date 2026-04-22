import { useState } from 'react'
import { useStudioStore } from '@/store/studioStore'
import { useScriptStream } from '@/hooks/useScriptStream'
import GenreSelector from './GenreSelector'
import Spinner from '@/components/shared/Spinner'

export default function IdeaForm() {
  const [ideaText, setIdeaText] = useState('')
  const [genre, setGenre] = useState('Romance')
  const [tone, setTone] = useState('Intense')

  const { isStreaming, phase1Complete, setError } = useStudioStore()
  const { startStream } = useScriptStream()

  async function handleGenerate() {
    if (!ideaText.trim()) return
    try {
      await startStream({ ideaText, genre, tone })
    } catch (err) {
      setError(err.message)
    }
  }

  const disabled = isStreaming || phase1Complete || !ideaText.trim()

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs text-studio-muted uppercase tracking-widest mb-2 block">
          Your idea
        </label>
        <textarea
          value={ideaText}
          onChange={(e) => setIdeaText(e.target.value)}
          disabled={isStreaming || phase1Complete}
          placeholder="A young executive discovers she married the wrong twin at a corporate merger ceremony…"
          rows={4}
          className="w-full bg-studio-bg border border-studio-border rounded-lg px-4 py-3 text-sm text-white placeholder-studio-muted focus:outline-none focus:border-duan-red resize-none disabled:opacity-50"
        />
      </div>

      <GenreSelector
        genre={genre}
        tone={tone}
        onGenreChange={setGenre}
        onToneChange={setTone}
      />

      <button
        onClick={handleGenerate}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-duan-red hover:bg-duan-red-dark disabled:bg-studio-card disabled:text-studio-muted text-white font-semibold py-3 rounded-lg transition-colors text-sm"
      >
        {isStreaming ? (
          <>
            <Spinner size={16} />
            Generating…
          </>
        ) : phase1Complete ? (
          '✓ Script Generated'
        ) : (
          'Generate Script'
        )}
      </button>
    </div>
  )
}
