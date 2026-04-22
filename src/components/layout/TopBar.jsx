import { useStudioStore } from '@/store/studioStore'
import { signOutUser } from '@/firebase/auth'
import { useNavigate } from 'react-router-dom'

export default function TopBar({ user, parsedScript }) {
  const { phase1Complete, phase2Complete, phase3Complete, reset } = useStudioStore()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOutUser()
    reset()
    navigate('/auth')
  }

  const phases = [
    { label: 'Script', done: phase1Complete },
    { label: 'Casting', done: phase2Complete },
    { label: 'Filming', done: phase3Complete },
  ]

  return (
    <header className="h-12 bg-studio-bg border-b border-studio-border flex items-center px-5 gap-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-duan-red font-bold text-base tracking-tight">短剧</span>
        <span className="text-studio-muted text-xs hidden sm:block">Studio</span>
      </div>

      {/* Project title */}
      <div className="flex-1 min-w-0">
        {parsedScript?.title ? (
          <span className="text-sm text-white font-medium truncate">{parsedScript.title}</span>
        ) : (
          <span className="text-sm text-studio-muted">New Project</span>
        )}
      </div>

      {/* Phase indicators */}
      <div className="hidden md:flex items-center gap-1">
        {phases.map((p, i) => (
          <span
            key={p.label}
            className={`text-xs px-2 py-0.5 rounded-full ${
              p.done ? 'bg-green-900/40 text-green-400' : 'bg-studio-card text-studio-muted'
            }`}
          >
            {p.done ? '✓ ' : `${i + 1}. `}{p.label}
          </span>
        ))}
      </div>

      {/* User */}
      {user && (
        <div className="flex items-center gap-2 shrink-0">
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-studio-muted hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  )
}
