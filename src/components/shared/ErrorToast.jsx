import { useEffect } from 'react'
import { useStudioStore } from '@/store/studioStore'

export default function ErrorToast() {
  const { error, clearError } = useStudioStore()

  useEffect(() => {
    if (!error) return
    const t = setTimeout(clearError, 5000)
    return () => clearTimeout(t)
  }, [error, clearError])

  if (!error) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg bg-red-900 border border-red-700 px-4 py-3 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="text-red-400 text-lg">⚠</span>
        <div>
          <p className="text-sm font-medium text-red-200">Error</p>
          <p className="text-xs text-red-300 mt-0.5">{error}</p>
        </div>
        <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-200 text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  )
}
