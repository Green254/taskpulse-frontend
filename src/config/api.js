const envApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()
const browserProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'
const fallbackApiBaseUrl = `${browserProtocol}//${browserHost}:8000`
const rawApiBaseUrl = envApiBaseUrl || fallbackApiBaseUrl

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')
export const API_URL = `${API_BASE_URL}/api`
export const CSRF_COOKIE_URL = `${API_BASE_URL}/sanctum/csrf-cookie`
