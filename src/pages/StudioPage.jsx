import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStudioStore } from '@/store/studioStore'
import TopBar from '@/components/layout/TopBar'
import StudioLayout from '@/components/layout/StudioLayout'
import WritingRoom from '@/components/phase1/WritingRoom'
import CastingRoom from '@/components/phase2/CastingRoom'
import FilmingRoom from '@/components/phase3/FilmingRoom'
import ErrorToast from '@/components/shared/ErrorToast'

export default function StudioPage({ user }) {
  const [searchParams] = useSearchParams()
  const { projectId, setProjectId, parsedScript } = useStudioStore()

  // Load project from URL param if present
  useEffect(() => {
    const pid = searchParams.get('project')
    if (pid && pid !== projectId) {
      setProjectId(pid)
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-studio-bg overflow-hidden">
      <TopBar user={user} parsedScript={parsedScript} />
      <StudioLayout
        left={<WritingRoom />}
        center={<CastingRoom projectId={projectId} />}
        right={<FilmingRoom projectId={projectId} />}
      />
      <ErrorToast />
    </div>
  )
}
