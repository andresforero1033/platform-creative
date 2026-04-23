import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'

const MotionSection = motion.section

const JOIN_AVAILABLE_ROLES = [
  { value: 'student', label: 'Estudiante' },
  { value: 'parent', label: 'Padre/Madre' },
  { value: 'teacher', label: 'Docente' },
]

const REGISTRATION_MODE = {
  JOIN: 'join_institution',
  CREATE: 'create_institution',
}

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    registrationMode: REGISTRATION_MODE.JOIN,
    institutionAdminUsername: '',
    adminUsername: '',
    institutionName: '',
    legalId: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    dni: '',
    childDni: '',
  })
  const [institution, setInstitution] = useState(null)
  const [validatingInstitutionAdmin, setValidatingInstitutionAdmin] = useState(false)
  const [institutionAdminError, setInstitutionAdminError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isValidPassword = useMemo(() => form.password.length >= 8, [form.password])
  const isJoinMode = form.registrationMode === REGISTRATION_MODE.JOIN
  const canShowPersonalFields = !isJoinMode || !!institution

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => {
      const nextState = { ...previous, [name]: value }

      if (name === 'registrationMode') {
        setInstitution(null)
        setInstitutionAdminError('')

        if (value === REGISTRATION_MODE.CREATE) {
          nextState.role = 'admin'
          nextState.institutionAdminUsername = ''
          nextState.childDni = ''
        } else {
          if (nextState.role === 'admin') {
            nextState.role = 'student'
          }
        }
      }

      if (name === 'role' && value !== 'parent') {
        nextState.childDni = ''
      }

      if (name === 'institutionAdminUsername') {
        setInstitution(null)
        setInstitutionAdminError('')
      }

      return nextState
    })

    setFieldErrors((previous) => ({ ...previous, [name]: '' }))
    setSubmitError('')
  }

  const handleValidateInstitutionAdmin = async () => {
    const candidate = form.institutionAdminUsername.trim().toLowerCase()

    if (!candidate) {
      setInstitutionAdminError('Ingresa un Usuario de la Institucion para validar.')
      return
    }

    setValidatingInstitutionAdmin(true)
    setInstitutionAdminError('')
    setSubmitError('')

    try {
      const response = await api.post(
        '/auth/validate-institution-admin',
        { institutionAdminUsername: candidate },
        { skipGlobalErrorToast: true },
      )

      const institutionPayload = response?.data?.data?.institution || null
      const isRegistrationEnabled = !!response?.data?.data?.isRegistrationEnabled

      if (!institutionPayload) {
        setInstitutionAdminError('No se pudo validar la institucion para este usuario.')
        return
      }

      if (!isRegistrationEnabled) {
        setInstitutionAdminError('La institucion existe pero no permite nuevos registros.')
        return
      }

      setInstitution(institutionPayload)
      setForm((previous) => ({
        ...previous,
        institutionAdminUsername: institutionPayload.adminUsername,
      }))
    } catch (error) {
      const validationError = error?.response?.data?.data?.[0]?.msg
      const backendMessage = error?.response?.data?.message
      setInstitutionAdminError(validationError || backendMessage || 'Usuario institucional no valido.')
    } finally {
      setValidatingInstitutionAdmin(false)
    }
  }

  const validateForm = () => {
    const nextErrors = {}

    if (isJoinMode && !institution) nextErrors.institutionAdminUsername = 'Valida primero un Usuario de la Institucion activo.'
    if (!isJoinMode && !form.adminUsername.trim()) nextErrors.adminUsername = 'El Usuario de la Institucion es obligatorio.'
    if (!isJoinMode && !form.institutionName.trim()) nextErrors.institutionName = 'El nombre de la institucion es obligatorio.'
    if (!isJoinMode && !form.legalId.trim()) nextErrors.legalId = 'El identificador legal es obligatorio.'

    if (!form.name.trim()) nextErrors.name = 'El nombre es obligatorio.'
    if (!form.email.trim()) nextErrors.email = 'El email es obligatorio.'
    if (!form.password) nextErrors.password = 'La password es obligatoria.'
    if (!isValidPassword) nextErrors.password = 'Usa al menos 8 caracteres.'
    if (!form.dni.trim()) nextErrors.dni = 'El DNI es obligatorio.'

    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Las passwords no coinciden.'
    }

    if (form.role === 'parent' && !form.childDni.trim()) {
      nextErrors.childDni = 'Para padres, el DNI del hijo es obligatorio.'
    }

    if (isJoinMode && !JOIN_AVAILABLE_ROLES.some((role) => role.value === form.role)) {
      nextErrors.role = 'Selecciona un rol valido.'
    }

    if (!isJoinMode && form.role !== 'admin') {
      nextErrors.role = 'Para crear institucion, el rol debe ser admin.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const basePayload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        dni: form.dni.trim().toUpperCase(),
        childDni: form.role === 'parent' ? form.childDni.trim().toUpperCase() : undefined,
      }

      const payload = isJoinMode
        ? {
          ...basePayload,
          registrationMode: REGISTRATION_MODE.JOIN,
          institutionAdminUsername: form.institutionAdminUsername.trim().toLowerCase(),
        }
        : {
          ...basePayload,
          registrationMode: REGISTRATION_MODE.CREATE,
          role: 'admin',
          adminUsername: form.adminUsername.trim().toLowerCase(),
          institutionName: form.institutionName.trim(),
          legalId: form.legalId.trim(),
        }

      const { dashboardPath } = await register(payload)

      navigate(dashboardPath, { replace: true })
    } catch (error) {
      const validationError = error?.response?.data?.data?.[0]?.msg
      const backendMessage = error?.response?.data?.message
      const networkMessage = error?.message === 'Network Error'
        ? 'No hay conexion con el backend. Verifica que API este en puerto 10000.'
        : ''

      setSubmitError(validationError || backendMessage || networkMessage || 'No se pudo completar el registro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-glow-blue" />
      <div className="auth-glow-purple" />
      <div className="auth-glow-yellow" />

      <MotionSection
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="glass-panel w-full max-w-md p-8"
      >
        <p className="glass-badge-blue">Nuevo Usuario</p>
        <h1 className="mt-4 text-3xl font-black text-slate-900">Crear cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">Configura tu tipo de registro y completa tus datos.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="registrationMode" className="glass-input-label">1. Tipo de registro</label>
            <select
              id="registrationMode"
              name="registrationMode"
              value={form.registrationMode}
              onChange={handleChange}
              className="glass-select"
            >
              <option value={REGISTRATION_MODE.JOIN}>Unirse a Institucion Existente</option>
              <option value={REGISTRATION_MODE.CREATE}>Crear Institucion Nueva (Director/Admin)</option>
            </select>
          </div>

          {isJoinMode ? (
            <div>
              <label htmlFor="institutionAdminUsername" className="glass-input-label">2. Usuario de la Institucion</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="institutionAdminUsername"
                name="institutionAdminUsername"
                value={form.institutionAdminUsername}
                onChange={handleChange}
                className="glass-input"
                type="text"
                placeholder="Ej: forero.admin"
                autoComplete="off"
                required
              />
              <button
                type="button"
                className="glass-cta-primary whitespace-nowrap"
                onClick={handleValidateInstitutionAdmin}
                disabled={validatingInstitutionAdmin}
              >
                {validatingInstitutionAdmin ? 'Validando...' : 'Validar usuario'}
              </button>
            </div>

            {institution ? (
              <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-sm text-emerald-800">
                <p className="font-semibold">Institucion validada: {institution.name}</p>
                <p className="text-xs">
                  Usuario institucional: {institution.adminUsername} | Estado licencia: {institution.licenseStatus}
                </p>
              </div>
            ) : null}

              {institutionAdminError ? <p className="mt-1 text-xs text-red-600">{institutionAdminError}</p> : null}
              {fieldErrors.institutionAdminUsername ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.institutionAdminUsername}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-white/70 bg-white/55 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">2. Datos de la nueva institucion</p>

              <div>
                <label htmlFor="adminUsername" className="glass-input-label">Usuario de la Institucion</label>
                <input
                  id="adminUsername"
                  name="adminUsername"
                  value={form.adminUsername}
                  onChange={handleChange}
                  className="glass-input"
                  type="text"
                  placeholder="Ej: forero.admin"
                  autoComplete="off"
                  required
                />
                {fieldErrors.adminUsername ? <p className="mt-1 text-xs text-red-600">{fieldErrors.adminUsername}</p> : null}
              </div>

              <div>
                <label htmlFor="institutionName" className="glass-input-label">Nombre de la Institucion</label>
                <input
                  id="institutionName"
                  name="institutionName"
                  value={form.institutionName}
                  onChange={handleChange}
                  className="glass-input"
                  type="text"
                  placeholder="Ej: IED Forero"
                  autoComplete="organization"
                  required
                />
                {fieldErrors.institutionName ? <p className="mt-1 text-xs text-red-600">{fieldErrors.institutionName}</p> : null}
              </div>

              <div>
                <label htmlFor="legalId" className="glass-input-label">Identificador Legal (NIT)</label>
                <input
                  id="legalId"
                  name="legalId"
                  value={form.legalId}
                  onChange={handleChange}
                  className="glass-input"
                  type="text"
                  placeholder="Ej: NIT-900000001"
                  autoComplete="off"
                  required
                />
                {fieldErrors.legalId ? <p className="mt-1 text-xs text-red-600">{fieldErrors.legalId}</p> : null}
              </div>
            </div>
          )}

          {canShowPersonalFields ? (
            <div className="space-y-4 rounded-2xl border border-white/70 bg-white/55 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">3. Datos personales</p>

              <div>
                <label htmlFor="name" className="glass-input-label">Nombre</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="glass-input"
                  type="text"
                  placeholder="Tu nombre"
                  autoComplete="name"
                  required
                />
                {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
              </div>

              <div>
                <label htmlFor="email" className="glass-input-label">Email</label>
                <input
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="glass-input"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
                {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
              </div>

              <div>
                <label htmlFor="role" className="glass-input-label">Rol</label>
                {isJoinMode ? (
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="glass-select"
                  >
                    {JOIN_AVAILABLE_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="role"
                    name="role"
                    value="admin"
                    className="glass-input"
                    type="text"
                    disabled
                  />
                )}
                {fieldErrors.role ? <p className="mt-1 text-xs text-red-600">{fieldErrors.role}</p> : null}
              </div>

              <div>
                <label htmlFor="dni" className="glass-input-label">DNI</label>
                <input
                  id="dni"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  className="glass-input"
                  type="text"
                  placeholder="Documento de identificacion"
                  autoComplete="off"
                  required
                />
                {fieldErrors.dni ? <p className="mt-1 text-xs text-red-600">{fieldErrors.dni}</p> : null}
              </div>

              {form.role === 'parent' ? (
                <div>
                  <label htmlFor="childDni" className="glass-input-label">DNI del hijo</label>
                  <input
                    id="childDni"
                    name="childDni"
                    value={form.childDni}
                    onChange={handleChange}
                    className="glass-input"
                    type="text"
                    placeholder="DNI del estudiante vinculado"
                    autoComplete="off"
                    required
                  />
                  {fieldErrors.childDni ? <p className="mt-1 text-xs text-red-600">{fieldErrors.childDni}</p> : null}
                </div>
              ) : null}

              <div>
                <label htmlFor="password" className="glass-input-label">Password</label>
                <input
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="glass-input"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  autoComplete="new-password"
                  required
                />
                {fieldErrors.password ? <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p> : null}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="glass-input-label">Confirmar password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="glass-input"
                  type="password"
                  placeholder="Repite tu password"
                  autoComplete="new-password"
                  required
                />
                {fieldErrors.confirmPassword ? <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p> : null}
              </div>
            </div>
          ) : null}

          {submitError ? (
            <p className="glass-error">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="glass-cta-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-600">
          Ya tienes cuenta?{' '}
          <Link to="/login" className="glass-link-blue">Inicia sesion</Link>
        </p>
      </MotionSection>
    </main>
  )
}

export default Register
