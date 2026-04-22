import { useEffect, useRef } from 'react'
import { useStudioStore } from '@/store/studioStore'

export default function ScriptStream() {
  const { streamingText, isStreaming, streamingDone } = useStudioStore()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [streamingText])

  if (!streamingText && !isStreaming) return null

  return (
    <div className="relative rounded-lg border border-studio-border bg-studio-bg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-studio-border bg-studio-card">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/60" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <span className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs text-studio-muted font-mono">script.json</span>
        {isStreaming && (
          <span className="ml-auto text-xs text-duan-red animate-pulse">● Live</span>
        )}
        {streamingDone && (
          <span className="ml-auto text-xs text-green-400">✓ Complete</span>
        )}
      </div>
      <pre className="font-mono text-xs text-green-300 p-4 max-h-96 overflow-y-auto whitespace-pre-wrap break-words leading-relaxed">
        {streamingText}
        {isStreaming && <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5 align-text-bottom" />}
        <div ref={bottomRef} />
      </pre>
    </div>
  )
}
