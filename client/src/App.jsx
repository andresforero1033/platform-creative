import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
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

const MotionDiv = motion.div

function RouteTransition({ children }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </MotionDiv>
  )
}

function App() {
  const location = useLocation()

  return (
    <>
      <Navbar />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            border: '1px solid rgba(255, 255, 255, 0.18)',
            background: 'rgba(17, 24, 39, 0.92)',
            color: '#f9fafb',
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<RouteTransition><Landing /></RouteTransition>} />
          <Route path="/login" element={<RouteTransition><Login /></RouteTransition>} />
          <Route path="/register" element={<RouteTransition><Register /></RouteTransition>} />
          <Route
            path="/dashboard/student"
            element={(
              <RouteTransition>
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              </RouteTransition>
            )}
          />
          <Route
            path="/dashboard/teacher"
            element={(
              <RouteTransition>
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              </RouteTransition>
            )}
          />
          <Route
            path="/dashboard/parent"
            element={(
              <RouteTransition>
                <ProtectedRoute allowedRoles={['parent']}>
                  <ParentDashboard />
                </ProtectedRoute>
              </RouteTransition>
            )}
          />
          <Route
            path="/dashboard/supervisor"
            element={(
              <RouteTransition>
                <ProtectedRoute allowedRoles={['supervisor']}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              </RouteTransition>
            )}
          />
          <Route
            path="/dashboard/admin"
            element={(
              <RouteTransition>
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              </RouteTransition>
            )}
          />
          <Route
            path="/subjects/:subjectId/lessons/:lessonId"
            element={(
              <RouteTransition>
                <ProtectedRoute allowedRoles={['student']}>
                  <LessonView />
                </ProtectedRoute>
              </RouteTransition>
            )}
          />
          <Route
            path="/profile"
            element={(
              <RouteTransition>
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              </RouteTransition>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

export default App
