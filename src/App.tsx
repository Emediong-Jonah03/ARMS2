import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import StudentDashboard from './pages/StudentDashboard'
import LecturerDashboard from './pages/LecturerDashboard'
import AdminDashboard from './pages/AdminDashboard'

function DashboardRouter() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  switch (user.role) {
    case 'student':
      return <StudentDashboard />
    case 'lecturer':
      return <LecturerDashboard />
    case 'admin':
      return <AdminDashboard />
    default:
      return <Navigate to="/login" replace />
  }
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
