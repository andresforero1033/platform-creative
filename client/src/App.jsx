import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import RoleDashboard from './pages/dashboard/RoleDashboard.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard/student"
        element={(
          <ProtectedRoute allowedRoles={['student']}>
            <RoleDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/teacher"
        element={(
          <ProtectedRoute allowedRoles={['teacher']}>
            <RoleDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/parent"
        element={(
          <ProtectedRoute allowedRoles={['parent']}>
            <RoleDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/supervisor"
        element={(
          <ProtectedRoute allowedRoles={['supervisor']}>
            <RoleDashboard />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/dashboard/admin"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <RoleDashboard />
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
