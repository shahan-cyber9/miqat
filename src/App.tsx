import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Archive from './pages/Archive'
import Settings from './pages/Settings'
import Instructions from './pages/Instructions'
import Rooms from './pages/Rooms'
import RoomDetail from './pages/RoomDetail'
import JoinRoom from './pages/JoinRoom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
      <Route path="/archive" element={<ProtectedRoute><Archive /></ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
      <Route path="/rooms/:roomId" element={<ProtectedRoute><RoomDetail /></ProtectedRoute>} />
      <Route path="/rooms/join/:roomId" element={<ProtectedRoute><JoinRoom /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/instructions" element={<ProtectedRoute><Instructions /></ProtectedRoute>} />
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