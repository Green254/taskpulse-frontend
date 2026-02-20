import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TextInput from '../components/TextInput'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'
import { API_BASE_URL, API_URL } from '../config/api'

const firstErrorFromPayload = (payload, fallbackMessage) => {
  if (payload?.message) {
    return payload.message
  }

  if (payload?.errors && typeof payload.errors === 'object') {
    for (const key of Object.keys(payload.errors)) {
      const fieldErrors = payload.errors[key]
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        return fieldErrors[0]
      }
    }
  }

  return fallbackMessage
}

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    departmentId: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState([])
  const [departmentsLoading, setDepartmentsLoading] = useState(true)

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    const loadDepartments = async () => {
      setDepartmentsLoading(true)

      try {
        const response = await fetch(`${API_URL}/departments`, {
          headers: {
            Accept: 'application/json',
          },
        })

        const payload = await response.json()
        if (!response.ok) {
          throw new Error(firstErrorFromPayload(payload, 'Failed to load departments'))
        }

        if (!cancelled) {
          const items = Array.isArray(payload) ? payload : []
          setDepartments(items)
          setForm((previous) => ({
            ...previous,
            departmentId: previous.departmentId || String(items[0]?.id || ''),
          }))
        }
      } catch (error) {
        if (!cancelled) {
          setToast({ message: error.message || 'Failed to load departments.', type: 'error' })
        }
      } finally {
        if (!cancelled) {
          setDepartmentsLoading(false)
        }
      }
    }

    loadDepartments()

    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationErrors = {}

    if (!form.name) validationErrors.name = 'Name is required.'
    if (!form.email) validationErrors.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email))
      validationErrors.email = 'Invalid email format.'
    if (!form.departmentId) validationErrors.departmentId = 'Department is required.'
    if (!form.password) validationErrors.password = 'Password is required.'
    else if (form.password.length < 8)
      validationErrors.password = 'Password must be at least 8 characters.'
    if (form.confirmPassword !== form.password)
      validationErrors.confirmPassword = 'Passwords do not match.'

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setToast({ message: 'Please fix the errors.', type: 'error' })
      return
    }

    setLoading(true)

    try {
      const registerResponse = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          department_id: Number(form.departmentId),
          password: form.password,
          password_confirmation: form.confirmPassword,
        }),
      })

      let registerPayload = {}
      try {
        registerPayload = await registerResponse.json()
      } catch {
        registerPayload = {}
      }

      if (!registerResponse.ok) {
        const apiFieldErrors = registerPayload?.errors || {}
        setErrors((previous) => ({
          ...previous,
          name: apiFieldErrors.name?.[0] || previous.name,
          email: apiFieldErrors.email?.[0] || previous.email,
          departmentId: apiFieldErrors.department_id?.[0] || previous.departmentId,
          password: apiFieldErrors.password?.[0] || previous.password,
        }))

        throw new Error(firstErrorFromPayload(registerPayload, 'Registration failed'))
      }

      const authToken = registerPayload?.token
      const authUser = registerPayload?.user

      if (!authToken || !authUser) {
        throw new Error('Invalid register response from server.')
      }

      login(authUser, authToken)
      setToast({ message: 'Registration successful!', type: 'success' })

      setTimeout(() => {
        navigate('/dashboard')
      }, 700)
    } catch (err) {
      const errorMessage =
        err instanceof TypeError
          ? `Unable to reach API at ${API_BASE_URL}. Check VITE_API_BASE_URL and backend CORS configuration.`
          : err.message

      setToast({ message: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-center mb-6">Register</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              id="name"
              label="Name"
              type="text"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
              autoComplete="name"
            />

            <TextInput
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="departmentId"
                name="departmentId"
                value={form.departmentId}
                onChange={handleChange}
                disabled={departmentsLoading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-100"
              >
                {departments.length === 0 ? (
                  <option value="">No departments found</option>
                ) : (
                  departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))
                )}
              </select>
              {errors.departmentId && (
                <p className="mt-1 text-sm text-red-600">{errors.departmentId}</p>
              )}
            </div>

            <TextInput
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="new-password"
            />

            <TextInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white transition duration-200 ${
                loading
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? <Spinner /> : 'Register'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:underline">
              Login
            </Link>
          </p>

          <p className="mt-2 text-center text-sm">
            <Link to="/" className="text-green-600 hover:underline">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
