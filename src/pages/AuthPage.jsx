import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithGoogle,
  auth,
} from '@/firebase/auth'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import Spinner from '@/components/shared/Spinner'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      navigate('/studio')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEmailAuth(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      navigate('/studio')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-studio-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-duan-red mb-1">短剧</h1>
          <p className="text-white text-lg font-semibold">Duǎn Jù Studio</p>
          <p className="text-studio-muted text-sm mt-1">AI short-form video series generator</p>
        </div>

        {/* Card */}
        <div className="bg-studio-panel border border-studio-border rounded-2xl p-6 space-y-5">
          <div className="flex gap-2">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
                  mode === m ? 'bg-duan-red text-white' : 'bg-studio-card text-studio-muted hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-studio-bg border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-studio-muted focus:outline-none focus:border-duan-red"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-studio-bg border border-studio-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-studio-muted focus:outline-none focus:border-duan-red"
            />

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-duan-red hover:bg-duan-red-dark disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? <Spinner size={16} /> : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-studio-border" />
            <span className="text-xs text-studio-muted">or</span>
            <div className="flex-1 h-px bg-studio-border" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
