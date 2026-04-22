import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase/auth'
import AuthPage from '@/pages/AuthPage'
import StudioPage from '@/pages/StudioPage'

function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div className="min-h-screen bg-studio-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-duan-red text-4xl font-bold mb-4">短剧</div>
          <div className="w-8 h-8 border-2 border-duan-red border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = loading
  const loading = user === undefined

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null))
    return unsub
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={user && !loading ? <Navigate to="/studio" replace /> : <AuthPage />} />
        <Route
          path="/studio"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <StudioPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/studio" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
