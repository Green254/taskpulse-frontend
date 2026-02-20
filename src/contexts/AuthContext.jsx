/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { API_URL } from '../config/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
    } catch (err) {
      console.warn('Logout API failed:', err)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')

    if (storedToken) {
      setToken(storedToken)
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    if (Array.isArray(user?.roles)) {
      return
    }

    let cancelled = false

    const syncMe = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401 && !cancelled) {
            await logout()
          }
          return
        }

        const me = await response.json()
        if (!cancelled) {
          setUser(me)
          localStorage.setItem('user', JSON.stringify(me))
        }
      } catch (error) {
        console.warn('Failed to sync authenticated user:', error)
      }
    }

    syncMe()

    return () => {
      cancelled = true
    }
  }, [token, user?.roles])

  const authFetch = async (url, options = {}) => {
    const headers = {
      Accept: 'application/json',
      ...(options.headers || {}),
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
    if (!isFormData && options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      await logout()
      throw new Error('Session expired. Please login again.')
    }

    if (response.status === 423) {
      let payload = {}
      try {
        payload = await response.clone().json()
      } catch {
        payload = {}
      }

      await logout()
      throw new Error(payload?.message || 'Your account is suspended. Contact an administrator.')
    }

    return response
  }

  const login = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', authToken)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
