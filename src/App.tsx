import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  
  if (loading) return <div className="flex min-h-screen items-center justify-center font-mono text-sm">LOADING...</div>
  if (!session) return <Navigate to="/auth" replace />
  
  return <>{children}</>
}

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) return <div className="flex min-h-screen items-center justify-center font-mono text-sm">LOADING...</div>

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}