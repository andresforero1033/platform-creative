import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard'

const ROLE_ORDER = ['student', 'teacher', 'parent', 'supervisor', 'admin']

const ROLE_LABELS = {
  student: 'Estudiantes',
  teacher: 'Docentes',
  parent: 'Padres',
  supervisor: 'Supervisores',
  admin: 'Admins',
}

const ROLE_TONES = {
  student: 'blue',
  teacher: 'purple',
  parent: 'yellow',
  supervisor: 'purple',
  admin: 'blue',
}

function formatDateTime(value) {
  if (!value) return 'Sin ejecucion previa'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin ejecucion previa'

  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState(null)
  const [triggerError, setTriggerError] = useState('')
  const [globalForm, setGlobalForm] = useState({ title: '', message: '' })
  const [sendingGlobalMessage, setSendingGlobalMessage] = useState(false)
  const [globalResult, setGlobalResult] = useState(null)
  const [globalError, setGlobalError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadMetrics = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/admin/users-by-role')
        const payload = response?.data?.data || null

        if (isMounted) {
          setMetrics(payload)
        }
      } catch {
        if (isMounted) {
          setError('No pudimos cargar las metricas de administracion.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMetrics()

    return () => {
      isMounted = false
    }
  }, [])

  const roleRows = useMemo(() => {
    const byRole = metrics?.byRole || {}

    return ROLE_ORDER.map((role) => ({
      role,
      label: ROLE_LABELS[role] || role,
      total: byRole[role] || 0,
      tone: ROLE_TONES[role] || 'blue',
    }))
  }, [metrics])

  const handleTriggerReminders = async () => {
    setTriggering(true)
    setTriggerError('')

    try {
      const response = await api.post('/admin/trigger-reminders')
      setTriggerResult(response?.data?.data || null)
    } catch {
      setTriggerError('No se pudieron enviar los recordatorios en este momento.')
    } finally {
      setTriggering(false)
    }
  }

  const handleGlobalInputChange = (event) => {
    const { name, value } = event.target
    setGlobalForm((previous) => ({
      ...previous,
      [name]: value,
    }))
    setGlobalError('')
  }

  const handleSendGlobalMessage = async (event) => {
    event.preventDefault()

    if (!globalForm.message.trim()) {
      setGlobalError('Escribe un mensaje para enviar al ecosistema.')
      return
    }

    setSendingGlobalMessage(true)
    setGlobalError('')

    try {
      const response = await api.post('/admin/broadcast-message', {
        title: globalForm.title.trim(),
        message: globalForm.message.trim(),
      })

      setGlobalResult(response?.data?.data || null)
      setGlobalForm({ title: '', message: '' })
    } catch {
      setGlobalError('No se pudo enviar el mensaje global en este momento.')
    } finally {
      setSendingGlobalMessage(false)
    }
  }

  return (
    <main className="app-shell overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-brand-purple/20 blur-3xl" />
        <div className="absolute right-0 top-12 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl" />
      </div>

      <section className="app-content space-y-6">
        <header className="glass-panel p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="glass-badge-purple">Admin</p>
            <p className="glass-badge-blue">Control Center</p>
          </div>
          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-4xl">Dashboard de Administracion</h1>
          <p className="mt-2 text-slate-600">
            Monitorea usuarios por rol y ejecuta campañas de recordatorios de repaso.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Usuarios totales"
            value={metrics?.totalUsers || 0}
            description="Base activa en plataforma"
            tone="blue"
          />
          <DashboardMetricCard
            label="Estudiantes"
            value={metrics?.byRole?.student || 0}
            description="Usuarios de aprendizaje"
            tone="purple"
          />
          <DashboardMetricCard
            label="Docentes"
            value={metrics?.byRole?.teacher || 0}
            description="Creadores de contenido"
            tone="yellow"
          />
          <DashboardMetricCard
            label="Padres"
            value={metrics?.byRole?.parent || 0}
            description="Cuentas de seguimiento familiar"
            tone="purple"
          />
        </section>

        {loading ? <p className="glass-panel p-4 text-sm font-semibold text-slate-600">Cargando dashboard admin...</p> : null}
        {error ? <p className="glass-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="glass-panel p-6">
              <h2 className="text-xl font-extrabold text-slate-900">Distribucion por rol</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {roleRows.map((item) => (
                  <DashboardMetricCard
                    key={item.role}
                    label={item.label}
                    value={item.total}
                    description={`Rol: ${item.role}`}
                    tone={item.tone}
                  />
                ))}
              </div>
            </section>

            <section className="glass-panel p-6">
              <h2 className="text-xl font-extrabold text-slate-900">Motor de recordatorios</h2>
              <p className="mt-2 text-sm text-slate-600">
                Ejecuta notificaciones para repasos pendientes de forma manual.
              </p>

              <button
                type="button"
                onClick={handleTriggerReminders}
                disabled={triggering}
                className="glass-cta-primary mt-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {triggering ? 'Enviando recordatorios...' : 'Disparar recordatorios'}
              </button>

              {triggerError ? <p className="glass-error mt-4">{triggerError}</p> : null}

              <article className="glass-card mt-4 border-brand-blue/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ultima ejecucion</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {formatDateTime(triggerResult?.processedAt)}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Recordatorios enviados: <span className="font-bold text-slate-900">{triggerResult?.remindersSent || 0}</span>
                </p>
              </article>

              <div className="mt-6 border-t border-white/60 pt-5">
                <h3 className="text-lg font-black text-slate-900">Mensaje global</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Envia alertas generales a toda la plataforma en tiempo real.
                </p>

                <form className="mt-4 space-y-3" onSubmit={handleSendGlobalMessage}>
                  <input
                    type="text"
                    name="title"
                    value={globalForm.title}
                    onChange={handleGlobalInputChange}
                    className="glass-input"
                    placeholder="Titulo del aviso (opcional)"
                  />

                  <textarea
                    name="message"
                    value={globalForm.message}
                    onChange={handleGlobalInputChange}
                    className="glass-input min-h-[100px] resize-y"
                    placeholder="Mensaje global para todos los usuarios"
                    required
                  />

                  <button
                    type="submit"
                    disabled={sendingGlobalMessage}
                    className="glass-cta-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingGlobalMessage ? 'Enviando mensaje...' : 'Enviar mensaje global'}
                  </button>
                </form>

                {globalError ? <p className="glass-error mt-3">{globalError}</p> : null}

                {globalResult ? (
                  <article className="glass-card mt-3 border-brand-purple/25 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ultimo broadcast</p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatDateTime(globalResult.processedAt)}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      Destinatarios alcanzados: <span className="font-bold text-slate-900">{globalResult.recipients || 0}</span>
                    </p>
                  </article>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default AdminDashboard
