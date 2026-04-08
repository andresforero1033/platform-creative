import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import StudentDashboard from './pages/dashboard/StudentDashboard.jsx'
import TeacherDashboard from './pages/dashboard/TeacherDashboard.jsx'
import SupervisorDashboard from './pages/dashboard/SupervisorDashboard.jsx'
import ParentDashboard from './pages/dashboard/ParentDashboard.jsx'
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx'
import LessonView from './pages/lessons/LessonView.jsx'
import Profile from './pages/Profile.jsx'
import Navbar from './components/landing/Navbar.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard/student"
          element={(
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard/teacher"
          element={(
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard/parent"
          element={(
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard/supervisor"
          element={(
            <ProtectedRoute allowedRoles={['supervisor']}>
              <SupervisorDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/dashboard/admin"
          element={(
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/subjects/:subjectId/lessons/:lessonId"
          element={(
            <ProtectedRoute allowedRoles={['student']}>
              <LessonView />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
