import { useState, useCallback } from 'react'
import { useStudioStore } from '@/store/studioStore'
import { auth } from '@/firebase/auth'
import { getFunctionUrl } from '@/utils/callFunction'

export function useEpisodeStream() {
  const { projectId, setCurrentEpId, setError } = useStudioStore()
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')

  const startEpisodeStream = useCallback(
    async ({ epNumber }) => {
      setIsStreaming(true)
      setStreamText('')

      try {
        const token = await auth.currentUser.getIdToken()
        const response = await fetch(getFunctionUrl('generateEpisode'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ projectId, epNumber }),
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(`Erreur HTTP ${response.status}: ${text}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let serverError = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop()

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue

            let msg
            try {
              msg = JSON.parse(raw)
            } catch {
              continue
            }

            if (msg.type === 'chunk') {
              setStreamText((t) => t + msg.text)
            } else if (msg.type === 'done') {
              setCurrentEpId(msg.epId)
            } else if (msg.type === 'error') {
              serverError = new Error(msg.message || 'Erreur serveur')
            }
          }

          if (serverError) break
        }

        if (serverError) throw serverError
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setIsStreaming(false)
      }
    },
    [projectId, setCurrentEpId, setError]
  )

  return { startEpisodeStream, isStreaming, streamText }
}
