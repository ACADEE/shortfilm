import { useCallback } from 'react'
import { useStudioStore } from '@/store/studioStore'
import { auth } from '@/firebase/auth'
import { getFunctionUrl } from '@/utils/callFunction'
import { tryParseJson } from '@/utils/parseStreamingJson'

export function useScriptStream() {
  const { startStreaming, appendStreamChunk, finalizeStream, setProjectId, setError } =
    useStudioStore()

  const startStream = useCallback(async ({ ideaText, genre, tone }) => {
    startStreaming()

    try {
      const token = await auth.currentUser.getIdToken()
      const url = getFunctionUrl('generateScript')

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ideaText, genre, tone }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''
      let projectId = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const msg = JSON.parse(raw)

            if (msg.type === 'project_id') {
              projectId = msg.projectId
              setProjectId(msg.projectId)
            } else if (msg.type === 'chunk') {
              fullText += msg.text
              appendStreamChunk(msg.text)
            } else if (msg.type === 'done') {
              const parsed = tryParseJson(fullText)
              finalizeStream(parsed)
            } else if (msg.type === 'error') {
              throw new Error(msg.message)
            }
          } catch (parseErr) {
            // Non-JSON line, skip
          }
        }
      }

      // Fallback finalize if [DONE] wasn't received
      const parsed = tryParseJson(fullText)
      finalizeStream(parsed)
      return projectId
    } catch (err) {
      setError(err.message)
      finalizeStream(null)
      throw err
    }
  }, [startStreaming, appendStreamChunk, finalizeStream, setProjectId, setError])

  return { startStream }
}
