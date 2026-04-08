import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import { connectRealtimeSocket, disconnectRealtimeSocket } from '../../realtime/socketClient'

const ACCESS_TOKEN_KEY = 'creative_access_token'

function normalizeNotification(rawNotification) {
  if (!rawNotification) return null

  return {
    _id: rawNotification._id || rawNotification.id,
    title: rawNotification.title,
    message: rawNotification.message,
    type: rawNotification.type,
    read: !!rawNotification.read,
    createdAt: rawNotification.createdAt,
    metadata: rawNotification.metadata || {},
  }
}

function formatRelativeDate(value) {
  if (!value) return 'Ahora'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Ahora'

  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationBell() {
  const navigate = useNavigate()
  const { user, getDashboardPathByRole } = useAuth()
  const userId = user?.id || user?._id || null
  const userRole = user?.role || null

  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )

  const upsertNotification = (incomingNotification) => {
    const normalized = normalizeNotification(incomingNotification)
    if (!normalized?._id) return

    setNotifications((previous) => {
      const index = previous.findIndex((item) => String(item._id) === String(normalized._id))

      if (index === -1) {
        return [normalized, ...previous].slice(0, 40)
      }

      const next = [...previous]
      next[index] = {
        ...next[index],
        ...normalized,
      }
      return next
    })
  }

  const loadNotifications = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/notifications/me')
      const payload = response?.data?.data?.notifications
      const incoming = Array.isArray(payload) ? payload.map(normalizeNotification).filter(Boolean) : []
      setNotifications(incoming)
    } catch {
      setError('No pudimos cargar las notificaciones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      disconnectRealtimeSocket()
      return
    }

    loadNotifications()
  }, [userId])

  useEffect(() => {
    if (!userId) return undefined

    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    const socket = connectRealtimeSocket(token)

    if (!socket) {
      return undefined
    }

    const handleRealtimeNotification = (payload) => {
      upsertNotification(payload)
    }

    socket.on('NEW_NOTIFICATION', handleRealtimeNotification)
    socket.on('badge_earned', handleRealtimeNotification)
    socket.on('new_lesson', handleRealtimeNotification)

    return () => {
      socket.off('NEW_NOTIFICATION', handleRealtimeNotification)
      socket.off('badge_earned', handleRealtimeNotification)
      socket.off('new_lesson', handleRealtimeNotification)
    }
  }, [userId])

  const resolveNotificationPath = (notification) => {
    const metadata = notification?.metadata || {}

    if (metadata.redirectPath) {
      return metadata.redirectPath
    }

    if (metadata.subjectId && metadata.lessonId) {
      return `/subjects/${metadata.subjectId}/lessons/${metadata.lessonId}`
    }

    if (metadata.eventName === 'badge_earned') {
      return userRole === 'parent' ? '/dashboard/parent' : '/dashboard/student'
    }

    return getDashboardPathByRole(userRole)
  }

  const handleNotificationClick = async (notification) => {
    const notificationId = notification?._id
    if (!notificationId) return

    try {
      await api.patch(`/notifications/${notificationId}/read`)
    } catch {
      // No bloqueamos navegación por un fallo de marcado.
    }

    setNotifications((previous) => previous.map((item) => (
      String(item._id) === String(notificationId)
        ? { ...item, read: true }
        : item
    )))

    const targetPath = resolveNotificationPath(notification)
    setIsOpen(false)
    navigate(targetPath)
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/me/read-all')
      setNotifications((previous) => previous.map((item) => ({ ...item, read: true })))
    } catch {
      setError('No se pudieron marcar como leidas.')
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="glass-cta-secondary relative"
        aria-label="Abrir notificaciones"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M10 17a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-purple px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section className="glass-panel absolute right-0 top-[calc(100%+10px)] z-50 w-[min(92vw,360px)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-700">Notificaciones</h3>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-brand-blue hover:text-brand-purple"
            >
              Marcar todas
            </button>
          </div>

          {loading ? <p className="text-sm text-slate-600">Cargando...</p> : null}
          {error ? <p className="glass-error">{error}</p> : null}

          {!loading && notifications.length === 0 ? (
            <p className="text-sm text-slate-600">Sin alertas por ahora.</p>
          ) : null}

          {!loading && notifications.length > 0 ? (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {notifications.map((notification) => (
                <li key={notification._id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${notification.read ? 'border-white/60 bg-white/55' : 'border-brand-blue/35 bg-brand-blue/10'}`}
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      {formatRelativeDate(notification.createdAt)}
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">{notification.title}</p>
                    <p className="mt-1 text-xs text-slate-700">{notification.message}</p>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

export default NotificationBell
