import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TextInput from '../components/TextInput'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const validationErrors = {}
    if (!form.email) validationErrors.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email))
      validationErrors.email = 'Invalid email format.'
    if (!form.password) validationErrors.password = 'Password is required.'

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setToast({ message: 'Please fix the errors.', type: 'error' })
      return
    }

    setLoading(true)

    // Simulate API login call
    setTimeout(() => {
      setLoading(false)
      setErrors({})
      setToast({ message: 'Login successful!', type: 'success' })

      // Redirect after a slight delay so user sees toast
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    }, 2000)
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
          <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
            />

            <TextInput
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white transition duration-200 ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? <Spinner /> : 'Login'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </p>

          <p className="mt-2 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
