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

    let projectId = null
    let fullText = ''

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
        const text = await response.text()
        throw new Error(`Erreur HTTP ${response.status}: ${text}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let serverError = null // track errors sent by the server

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE uses \n\n as event separator; split on \n to get individual lines
        const lines = buffer.split('\n')
        buffer = lines.pop() // last incomplete line stays in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          // Parse the SSE envelope — keep JSON errors separate from server errors
          let msg
          try {
            msg = JSON.parse(raw)
          } catch {
            // Not a JSON envelope — skip (shouldn't happen with our server)
            continue
          }

          if (msg.type === 'project_id') {
            projectId = msg.projectId
            setProjectId(msg.projectId)
          } else if (msg.type === 'chunk') {
            fullText += msg.text
            appendStreamChunk(msg.text)
          } else if (msg.type === 'done') {
            // Server signals completion — parse whatever we've accumulated
            const parsed = tryParseJson(fullText)
            finalizeStream(parsed)
          } else if (msg.type === 'error') {
            // Server-side error — record and break the loop
            serverError = new Error(msg.message || 'Erreur serveur inconnue')
          }
        }

        if (serverError) break
      }

      if (serverError) throw serverError

      // Fallback: if 'done' was not received (e.g. connection drop), try to parse
      const parsed = tryParseJson(fullText)
      if (parsed) finalizeStream(parsed)

      return projectId
    } catch (err) {
      setError(err.message)
      finalizeStream(null)
      throw err
    }
  }, [startStreaming, appendStreamChunk, finalizeStream, setProjectId, setError])

  return { startStream }
}
