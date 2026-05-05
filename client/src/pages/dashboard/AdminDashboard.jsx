import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import api from '../../api/axios'
import DashboardMetricCard from '../../components/dashboard/DashboardMetricCard'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import useAuth from '../../hooks/useAuth'

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

const MANAGED_ROLE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'student', label: 'Estudiantes' },
  { value: 'teacher', label: 'Docentes' },
  { value: 'parent', label: 'Padres' },
]

const MANAGED_ROLE_LABELS = {
  student: 'Estudiante',
  teacher: 'Docente',
  parent: 'Padre/Madre',
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
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [roleFilter, setRoleFilter] = useState('all')
  const [institutionUsersSummary, setInstitutionUsersSummary] = useState(null)
  const [institutionUsers, setInstitutionUsers] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [processingBulk, setProcessingBulk] = useState(false)
  const [loadingInstitutionUsers, setLoadingInstitutionUsers] = useState(true)
  const [institutionUsersError, setInstitutionUsersError] = useState('')
  const [activationInProgressUserId, setActivationInProgressUserId] = useState('')

  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState(null)
  const [triggerError, setTriggerError] = useState('')
  const [globalForm, setGlobalForm] = useState({ title: '', message: '' })
  const [sendingGlobalMessage, setSendingGlobalMessage] = useState(false)
  const [globalResult, setGlobalResult] = useState(null)
  const [globalError, setGlobalError] = useState('')
  const [brand, setBrand] = useState({ logoUrl: '', primaryColor: '' })
  const [loadingBrand, setLoadingBrand] = useState(true)
  const [brandError, setBrandError] = useState('')
  const [savingBrand, setSavingBrand] = useState(false)
  const [staffStats, setStaffStats] = useState(null)
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffPeriod, setStaffPeriod] = useState('month')

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

  const pendingInstitutionUsers = useMemo(
    () => institutionUsers.filter((account) => account.isInstitutionValidated === false).length,
    [institutionUsers],
  )

  const loadInstitutionUsers = async (targetRoleFilter = roleFilter) => {
    setLoadingInstitutionUsers(true)
    setInstitutionUsersError('')

    try {
      const response = await api.get('/admin/institution-users', {
        params: targetRoleFilter !== 'all' ? { role: targetRoleFilter } : undefined,
      })

      const payload = response?.data?.data || null
      setInstitutionUsersSummary(payload)
      setInstitutionUsers(Array.isArray(payload?.users) ? payload.users : [])
      // reset selection when reloading
      setSelectedIds([])
    } catch {
      setInstitutionUsersError('No se pudo cargar la gestion de usuarios institucionales.')
      setInstitutionUsersSummary(null)
      setInstitutionUsers([])
    } finally {
      setLoadingInstitutionUsers(false)
    }
  }

  useEffect(() => {
    loadInstitutionUsers(roleFilter)
  }, [roleFilter])

  useEffect(() => {
    let mounted = true
    const loadStaff = async () => {
      setLoadingStaff(true)
      setStaffError('')

      try {
        const res = await api.get('/admin/staff-stats', { params: { period: staffPeriod } })
        if (!mounted) return
        setStaffStats(res?.data?.data || null)
      } catch (e) {
        if (mounted) setStaffError('No se pudieron cargar las estadisticas de docentes.')
      } finally {
        if (mounted) setLoadingStaff(false)
      }
    }

    loadStaff()

    return () => { mounted = false }
  }, [staffPeriod])

  useEffect(() => {
    let mounted = true
    const loadBrand = async () => {
      setLoadingBrand(true)
      setBrandError('')
      try {
        const res = await api.get('/admin/institution/brand')
        const data = res?.data?.data || {}
        if (mounted) {
          setBrand({ logoUrl: data.logoUrl || '', primaryColor: data.primaryColor || '' })
        }
      } catch (e) {
        if (mounted) setBrandError('No se pudo cargar la marca institucional.')
      } finally {
        if (mounted) setLoadingBrand(false)
      }
    }

    loadBrand()

    return () => { mounted = false }
  }, [])

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

  const handleActivateUser = async (targetUserId) => {
    setActivationInProgressUserId(targetUserId)
    setInstitutionUsersError('')

    try {
      await api.patch(`/admin/institution-users/${targetUserId}/activation`, {
        isInstitutionValidated: true,
      })

      setInstitutionUsers((previous) => previous.map((account) => (
        account.id === targetUserId
          ? { ...account, isInstitutionValidated: true }
          : account
      )))
    } catch {
      setInstitutionUsersError('No se pudo activar el usuario seleccionado.')
    } finally {
      setActivationInProgressUserId('')
    }
  }

  const adminReference = institutionUsersSummary?.institutionAdminReference || user?.institutionAdminReference || ''

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleBulkAction = async (isValidated) => {
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) return

    setProcessingBulk(true)
    try {
      const response = await api.patch('/admin/users/bulk-activation', {
        userIds: selectedIds,
        isInstitutionValidated: !!isValidated,
      })

      const info = response?.data?.data || {}
      const processed = info.modified || info.modifiedCount || 0
      const requested = info.requested || selectedIds.length

      // update local state for those users
      setInstitutionUsers((prev) => prev.map((u) => (
        selectedIds.includes(u.id) ? { ...u, isInstitutionValidated: !!isValidated } : u
      )))

      toast.success(`${processed} de ${requested} usuarios procesados correctamente.`)
      setSelectedIds([])
    } catch (err) {
      toast.error('No se pudo completar la operacion en lote.')
    } finally {
      setProcessingBulk(false)
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
          <div className="space-y-6">
            <section className="glass-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Admin Hub de roles</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Usuario institucional: <span className="font-bold text-slate-900">{institutionUsersSummary?.institutionAdminReference || user?.institutionAdminReference || '-'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {MANAGED_ROLE_FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => setRoleFilter(filter.value)}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                        roleFilter === filter.value
                          ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/25'
                          : 'bg-white/70 text-slate-700 hover:bg-white'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <DashboardMetricCard
                  label="Usuarios listados"
                  value={institutionUsers.length}
                  description={`Filtro actual: ${roleFilter}`}
                  tone="blue"
                />
                <DashboardMetricCard
                  label="Pendientes"
                  value={pendingInstitutionUsers}
                  description="Requieren activacion"
                  tone="yellow"
                />
                <DashboardMetricCard
                  label="Activos"
                  value={institutionUsers.length - pendingInstitutionUsers}
                  description="Acceso institucional habilitado"
                  tone="purple"
                />
              </div>

              {loadingInstitutionUsers ? (
                <p className="mt-4 text-sm font-semibold text-slate-600">Cargando usuarios institucionales...</p>
              ) : null}

              {institutionUsersError ? <p className="glass-error mt-4">{institutionUsersError}</p> : null}

              {!loadingInstitutionUsers && !institutionUsersError ? (
                institutionUsers.length === 0 ? (
                  <p className="mt-4 rounded-2xl border border-white/70 bg-white/65 p-4 text-sm text-slate-600">
                    No hay usuarios para este filtro.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === institutionUsers.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const validIds = institutionUsers
                                .filter((u) => (u.institutionAdminReference || '') === adminReference)
                                .map((u) => u.id)
                              setSelectedIds(validIds)
                            } else {
                              setSelectedIds([])
                            }
                          }}
                        />
                        Seleccionar todos
                      </label>
                      <div className="text-sm text-slate-500">Seleccionados: {selectedIds.length}</div>
                    </div>

                    {institutionUsers.map((account) => (
                      <article key={account.id} className="glass-card border-brand-blue/20 p-4">
                        <div className="flex items-start gap-3">
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(account.id)}
                              onChange={() => toggleSelect(account.id)}
                              disabled={(account.institutionAdminReference || '') !== adminReference}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-black text-slate-900">{account.name}</p>
                                <p className="text-xs text-slate-600">{account.email}</p>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                  {MANAGED_ROLE_LABELS[account.role] || account.role}
                                </p>
                                <p className="text-xs text-slate-500">DNI: {account.dni || 'Sin DNI'}</p>
                              </div>

                              <div className="flex items-center gap-3">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                                    account.isInstitutionValidated === false
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {account.isInstitutionValidated === false ? 'Pendiente' : 'Activo'}
                                </span>

                                {account.isInstitutionValidated === false ? (
                                  <button
                                    type="button"
                                    onClick={() => handleActivateUser(account.id)}
                                    disabled={activationInProgressUserId === account.id}
                                    className="glass-cta-primary disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {activationInProgressUserId === account.id ? 'Activando...' : 'Activar'}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : null}
            </section>

            <section className="glass-panel p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Rendimiento de Docentes</h2>
                  <p className="mt-1 text-sm text-slate-600">Visibilidad de actividad, lecciones y alumnos por docente.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-600">Periodo:</div>
                  <button
                    type="button"
                    onClick={() => setStaffPeriod('month')}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${staffPeriod === 'month' ? 'bg-brand-blue text-white' : 'bg-white/70'}`}
                  >
                    Este Mes
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffPeriod('all')}
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${staffPeriod === 'all' ? 'bg-brand-blue text-white' : 'bg-white/70'}`}
                  >
                    Todo el tiempo
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="glass-cta-secondary"
                  >
                    Exportar Resumen
                  </button>
                </div>
              </div>

              {loadingStaff ? <p className="mt-4 text-sm text-slate-600">Cargando estadisticas...</p> : null}
              {staffError ? <p className="glass-error mt-3">{staffError}</p> : null}

              {!loadingStaff && staffStats ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <div>
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left text-xs text-slate-600">
                          <th>Nombre</th>
                          <th>Última actividad</th>
                          <th>L. creadas</th>
                          <th>Estudiantes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(staffStats.teachers) && staffStats.teachers.length > 0 ? (
                          staffStats.teachers.map((t) => (
                            <tr key={t.id} className="border-t">
                              <td className="py-3 font-semibold text-slate-800">{t.name}</td>
                              <td className="py-3 text-slate-600">{t.lastActivity ? new Date(t.lastActivity).toLocaleString('es-ES') : '—'}</td>
                              <td className="py-3 text-slate-700">{t.lessonsCreated}</td>
                              <td className="py-3 text-slate-700">{t.studentsEnrolled}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 text-slate-600">No hay docentes para el periodo seleccionado.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-4">
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={staffStats.lessonsDistributionBySubject || []}
                            dataKey="count"
                            nameKey="name"
                            innerRadius={30}
                            outerRadius={60}
                          >
                            {(staffStats.lessonsDistributionBySubject || []).map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.color || '#8884d8'} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={staffStats.lessonsDistributionBySubject || []}>
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="var(--brand-primary)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

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
              <h2 className="text-xl font-extrabold text-slate-900">Mi Institución</h2>
              <p className="mt-1 text-sm text-slate-600">Configura el logo y color primario de tu institución.</p>

              {loadingBrand ? (
                <p className="mt-4 text-sm text-slate-600">Cargando datos de marca...</p>
              ) : null}

              {brandError ? <p className="glass-error mt-3">{brandError}</p> : null}

              {!loadingBrand ? (
                <form
                  className="mt-4 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setSavingBrand(true)
                    setBrandError('')
                    try {
                      const payload = { logoUrl: brand.logoUrl || null, primaryColor: brand.primaryColor || null }
                      await api.patch('/admin/institution/brand', payload)
                      toast.success('Marca institucional actualizada')
                    } catch (err) {
                      setBrandError('No se pudo guardar la marca en este momento.')
                    } finally {
                      setSavingBrand(false)
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-20 rounded-lg overflow-hidden border bg-white/60 flex items-center justify-center">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="text-sm text-slate-500">Sin logo</div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="URL del logo (https://...)"
                        value={brand.logoUrl}
                        onChange={(ev) => setBrand((p) => ({ ...p, logoUrl: ev.target.value }))}
                        className="glass-input"
                      />

                      <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600">Color primario</label>
                        <input
                          type="color"
                          value={brand.primaryColor || '#7c3aed'}
                          onChange={(ev) => setBrand((p) => ({ ...p, primaryColor: ev.target.value }))}
                          className="w-12 h-8 p-0 border rounded"
                        />
                        <input
                          type="text"
                          value={brand.primaryColor || ''}
                          onChange={(ev) => setBrand((p) => ({ ...p, primaryColor: ev.target.value }))}
                          placeholder="#7c3aed"
                          className="glass-input max-w-[160px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="submit"
                      disabled={savingBrand}
                      className="glass-cta-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingBrand ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              ) : null}
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
          </div>
        ) : null}
        {selectedIds.length > 0 ? (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white/80 p-3 rounded-xl shadow-lg">
            <div className="text-sm font-semibold">{selectedIds.length} seleccionados</div>
            <button
              type="button"
              onClick={() => handleBulkAction(true)}
              disabled={processingBulk}
              className="glass-cta-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Activar seleccionados
            </button>
            <button
              type="button"
              onClick={() => handleBulkAction(false)}
              disabled={processingBulk}
              className="px-4 py-2 rounded-full bg-white border border-red-200 text-red-700 font-semibold disabled:opacity-60"
            >
              Suspender seleccionados
            </button>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default AdminDashboard
