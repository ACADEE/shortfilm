import { useState, useRef, useEffect } from 'react'
import { useFirestoreSnapshot } from '@/hooks/useFirestoreSnapshot'
import { plansCol } from '@/firebase/firestore'

export default function VideoPlayer({ projectId, epId }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef(null)

  const { docs: plans } = useFirestoreSnapshot(
    projectId && epId ? plansCol(projectId, epId) : null,
    'plan_number'
  )

  const readyPlans = plans.filter((p) => p.mp4_url)

  useEffect(() => {
    if (videoRef.current && readyPlans[currentIndex]?.mp4_url) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {})
    }
  }, [currentIndex, readyPlans[currentIndex]?.mp4_url])

  function handleEnded() {
    if (currentIndex < readyPlans.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  const currentClip = readyPlans[currentIndex]

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 9:16 player */}
      <div
        className="relative bg-black rounded-xl overflow-hidden border border-studio-border shadow-2xl"
        style={{ width: '100%', maxWidth: '200px', aspectRatio: '9/16' }}
      >
        {currentClip ? (
          <>
            <video
              ref={videoRef}
              src={currentClip.mp4_url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              onEnded={handleEnded}
            />
            {/* Subtitle overlay */}
            {currentClip.subtitles && (
              <div className="absolute bottom-4 left-0 right-0 px-3 text-center">
                <span className="inline-block bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                  {currentClip.subtitles}
                </span>
              </div>
            )}
            {/* Plan indicator */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-mono">
              {currentIndex + 1}/{readyPlans.length}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2 opacity-20">🎬</div>
              <p className="text-xs text-studio-muted">Clips will appear here</p>
            </div>
          </div>
        )}
      </div>

      {/* Clip navigation */}
      {readyPlans.length > 1 && (
        <div className="flex gap-1 flex-wrap justify-center max-w-xs">
          {readyPlans.map((plan, i) => (
            <button
              key={plan.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-5 h-1.5 rounded-full transition-colors ${
                i === currentIndex ? 'bg-duan-red' : 'bg-studio-border hover:bg-studio-muted'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
