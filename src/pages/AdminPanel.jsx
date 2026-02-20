import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '../config/api'

const ROLE_OPTIONS = ['admin', 'manager', 'staff', 'watchman', 'chef', 'user']
const ANNOUNCEMENT_TYPES = ['info', 'warning', 'critical', 'celebration']
const TARGET_SCOPES = ['all', 'role', 'department']

const safeJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

const getApiError = (payload, fallback) => {
  if (payload?.message) return payload.message
  if (payload?.errors) {
    const first = Object.values(payload.errors).flat()[0]
    if (first) return first
  }
  return fallback
}

const detectPrimaryRole = (row) => {
  const names = Array.isArray(row?.roles) ? row.roles.map((role) => role.name) : []
  return ROLE_OPTIONS.find((value) => names.includes(value)) || 'user'
}

const plusDaysIso = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const { user, authFetch, logout } = useAuth()

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [toast, setToast] = useState(null)

  const [summary, setSummary] = useState(null)
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [themes, setThemes] = useState([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager',
    departmentId: '',
  })

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info',
    targetScope: 'all',
    targetRole: 'manager',
    targetDepartmentId: '',
    isPinned: false,
  })

  const [newTheme, setNewTheme] = useState({
    name: '',
    tagline: '',
    bannerMessage: '',
    primaryColor: '#0f172a',
    accentColor: '#2563eb',
    surfaceColor: '#ffffff',
    isActive: true,
  })

  const hasStoredSession = Boolean(localStorage.getItem('token'))
  const isAdmin = Array.isArray(user?.roles) && user.roles.some((role) => role.name === 'admin')

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((row) => {
      const roles = Array.isArray(row.roles) ? row.roles.map((role) => role.name) : []
      const matchQuery =
        !query ||
        String(row.name || '').toLowerCase().includes(query) ||
        String(row.email || '').toLowerCase().includes(query)
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !row.is_currently_suspended) ||
        (statusFilter === 'suspended' && row.is_currently_suspended)
      const matchRole = !roleFilter || roles.includes(roleFilter)
      const matchDepartment = !departmentFilter || Number(row.department_id) === Number(departmentFilter)
      return matchQuery && matchStatus && matchRole && matchDepartment
    })
  }, [users, search, statusFilter, roleFilter, departmentFilter])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [summaryRes, usersRes, departmentsRes, announcementsRes, themesRes] = await Promise.all([
        authFetch(`${API_URL}/admin/summary`),
        authFetch(`${API_URL}/admin/users`),
        authFetch(`${API_URL}/departments`),
        authFetch(`${API_URL}/admin/announcements`),
        authFetch(`${API_URL}/admin/themes`),
      ])

      const [summaryPayload, usersPayload, departmentsPayload, announcementsPayload, themesPayload] = await Promise.all([
        safeJson(summaryRes),
        safeJson(usersRes),
        safeJson(departmentsRes),
        safeJson(announcementsRes),
        safeJson(themesRes),
      ])

      if (!summaryRes.ok) throw new Error(getApiError(summaryPayload, 'Failed to load summary'))
      if (!usersRes.ok) throw new Error(getApiError(usersPayload, 'Failed to load users'))
      if (!departmentsRes.ok) throw new Error(getApiError(departmentsPayload, 'Failed to load departments'))
      if (!announcementsRes.ok) throw new Error(getApiError(announcementsPayload, 'Failed to load announcements'))
      if (!themesRes.ok) throw new Error(getApiError(themesPayload, 'Failed to load themes'))

      const allDepartments = Array.isArray(departmentsPayload) ? departmentsPayload : []

      setSummary(summaryPayload)
      setUsers(Array.isArray(usersPayload) ? usersPayload : [])
      setDepartments(allDepartments)
      setAnnouncements(Array.isArray(announcementsPayload) ? announcementsPayload : [])
      setThemes(Array.isArray(themesPayload) ? themesPayload : [])

      const defaultDepartmentId = String(allDepartments[0]?.id || '')
      setNewUser((previous) => ({ ...previous, departmentId: previous.departmentId || defaultDepartmentId }))
      setNewAnnouncement((previous) => ({
        ...previous,
        targetDepartmentId: previous.targetDepartmentId || defaultDepartmentId,
      }))
    } catch (error) {
      setToast({ message: error.message || 'Failed to load admin dashboard.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadAdminData()
  }, [user?.id])

  const upsertUser = (updatedUser) => {
    setUsers((previous) => previous.map((row) => (row.id === updatedUser.id ? updatedUser : row)))
  }

  const runUserAction = async (endpoint, options, onSuccess) => {
    setWorking(true)
    try {
      const response = await authFetch(endpoint, options)
      const payload = await safeJson(response)
      if (!response.ok) throw new Error(getApiError(payload, 'Action failed'))
      onSuccess?.(payload)
    } catch (error) {
      setToast({ message: error.message || 'Action failed.', type: 'error' })
    } finally {
      setWorking(false)
    }
  }

  const suspendUser = async (row) => {
    const reason = window.prompt(`Suspend ${row.name}. Reason (optional):`, row.suspension_reason || '') || ''
    const daysText = window.prompt('How many days? Leave empty for indefinite:', '7')
    const payload = {}
    if (reason.trim()) payload.reason = reason.trim()
    if (daysText && daysText.trim()) {
      const days = Number(daysText)
      if (!Number.isFinite(days) || days <= 0) {
        setToast({ message: 'Days must be a positive number.', type: 'error' })
        return
      }
      payload.until = plusDaysIso(days)
    }

    await runUserAction(`${API_URL}/admin/users/${row.id}/suspend`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }, (payloadResponse) => {
      upsertUser(payloadResponse.user)
      setToast({ message: `${row.name} suspended.`, type: 'success' })
    })
  }

  const reactivateUser = async (row) => {
    await runUserAction(`${API_URL}/admin/users/${row.id}/reactivate`, {
      method: 'PATCH',
    }, (payloadResponse) => {
      upsertUser(payloadResponse.user)
      setToast({ message: `${row.name} reactivated.`, type: 'success' })
    })
  }

  const deleteUser = async (row) => {
    if (!window.confirm(`Delete ${row.name}?`)) return
    await runUserAction(`${API_URL}/admin/users/${row.id}`, {
      method: 'DELETE',
    }, () => {
      setUsers((previous) => previous.filter((item) => item.id !== row.id))
      setToast({ message: `${row.name} deleted.`, type: 'success' })
    })
  }

  const updateUserRole = async (row, role) => {
    await runUserAction(`${API_URL}/admin/users/${row.id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }, (payloadResponse) => {
      upsertUser(payloadResponse.user)
      setToast({ message: `${row.name} role updated.`, type: 'success' })
    })
  }

  const createUser = async (event) => {
    event.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password) {
      setToast({ message: 'Name, email and password are required.', type: 'error' })
      return
    }

    await runUserAction(`${API_URL}/admin/users`, {
      method: 'POST',
      body: JSON.stringify({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.role,
        department_id: Number(newUser.departmentId),
      }),
    }, (payloadResponse) => {
      setUsers((previous) => [payloadResponse.user, ...previous])
      setNewUser((previous) => ({ ...previous, name: '', email: '', password: '' }))
      setToast({ message: 'User created.', type: 'success' })
    })
  }

  const createAnnouncement = async (event) => {
    event.preventDefault()
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      setToast({ message: 'Announcement title and message are required.', type: 'error' })
      return
    }

    const payload = {
      title: newAnnouncement.title.trim(),
      message: newAnnouncement.message.trim(),
      type: newAnnouncement.type,
      target_scope: newAnnouncement.targetScope,
      is_pinned: newAnnouncement.isPinned,
      is_active: true,
    }
    if (newAnnouncement.targetScope === 'role') payload.target_role = newAnnouncement.targetRole
    if (newAnnouncement.targetScope === 'department') payload.target_department_id = Number(newAnnouncement.targetDepartmentId)

    await runUserAction(`${API_URL}/admin/announcements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, (payloadResponse) => {
      setAnnouncements((previous) => [payloadResponse.announcement, ...previous])
      setNewAnnouncement((previous) => ({ ...previous, title: '', message: '' }))
      setToast({ message: 'Announcement posted.', type: 'success' })
    })
  }

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    await runUserAction(`${API_URL}/admin/announcements/${id}`, {
      method: 'DELETE',
    }, () => {
      setAnnouncements((previous) => previous.filter((item) => item.id !== id))
      setToast({ message: 'Announcement deleted.', type: 'success' })
    })
  }

  const createTheme = async (event) => {
    event.preventDefault()
    if (!newTheme.name.trim()) {
      setToast({ message: 'Theme name is required.', type: 'error' })
      return
    }

    await runUserAction(`${API_URL}/admin/themes`, {
      method: 'POST',
      body: JSON.stringify({
        name: newTheme.name.trim(),
        tagline: newTheme.tagline.trim() || null,
        banner_message: newTheme.bannerMessage.trim() || null,
        primary_color: newTheme.primaryColor,
        accent_color: newTheme.accentColor,
        surface_color: newTheme.surfaceColor,
        is_active: newTheme.isActive,
      }),
    }, (payloadResponse) => {
      setThemes((previous) => [payloadResponse.theme, ...previous.map((item) => ({ ...item, is_active: false }))])
      setNewTheme((previous) => ({ ...previous, name: '', tagline: '', bannerMessage: '' }))
      setToast({ message: 'Theme created.', type: 'success' })
    })
  }

  const activateTheme = async (id) => {
    await runUserAction(`${API_URL}/admin/themes/${id}/activate`, {
      method: 'PATCH',
    }, (payloadResponse) => {
      setThemes((previous) => previous.map((item) => (item.id === id ? payloadResponse.theme : { ...item, is_active: false })))
      setToast({ message: 'Theme activated.', type: 'success' })
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user && !hasStoredSession) return <Navigate to="/login" replace />
  if (!user) return <div className="min-h-screen grid place-items-center bg-slate-100 text-slate-600">Loading admin panel...</div>
  if (!isAdmin) return <Navigate to="/unauthorized" replace />

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Master Admin Dashboard</h1>
              <p className="text-sm text-slate-600">Suspend/delete users, manage hierarchy, announcements, and system themes.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={loadAdminData} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Refresh</button>
              <Link to="/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Dashboard</Link>
              <button onClick={handleLogout} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Logout</button>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Users</p><p className="mt-2 text-3xl font-semibold text-slate-900">{summary?.total_users ?? '-'}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Active Users</p><p className="mt-2 text-3xl font-semibold text-emerald-600">{summary?.active_users ?? '-'}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Suspended</p><p className="mt-2 text-3xl font-semibold text-rose-600">{summary?.suspended_users ?? '-'}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Departments</p><p className="mt-2 text-3xl font-semibold text-blue-600">{summary?.department_count ?? '-'}</p></div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search user" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">All roles</option>{ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}</select>
              <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-600">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-2 pr-3 font-medium">User</th><th className="py-2 pr-3 font-medium">Department</th><th className="py-2 pr-3 font-medium">Roles</th><th className="py-2 pr-3 font-medium">Status</th><th className="py-2 pr-3 font-medium">Hierarchy</th><th className="py-2 pr-3 font-medium">Actions</th></tr></thead>
                  <tbody>
                    {filteredUsers.map((row) => {
                      const isCurrentUser = row.id === user.id
                      return (
                        <tr key={row.id} className="border-b border-slate-100 align-top">
                          <td className="py-3 pr-3"><p className="font-medium text-slate-900">{row.name}</p><p className="text-xs text-slate-500">{row.email}</p></td>
                          <td className="py-3 pr-3 text-slate-700">{row.department?.name || 'N/A'}</td>
                          <td className="py-3 pr-3"><div className="flex flex-wrap gap-1">{(row.roles || []).map((role) => <span key={`${row.id}-${role.id}`} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{role.name}</span>)}</div></td>
                          <td className="py-3 pr-3">{row.is_currently_suspended ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">Suspended</span> : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>}</td>
                          <td className="py-3 pr-3"><select value={detectPrimaryRole(row)} onChange={(event) => updateUserRole(row, event.target.value)} disabled={working || isCurrentUser} className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:bg-slate-100">{ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}</select></td>
                          <td className="py-3 pr-3"><div className="flex flex-wrap gap-2">{row.is_currently_suspended ? <button type="button" onClick={() => reactivateUser(row)} disabled={working} className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed">Reactivate</button> : <button type="button" onClick={() => suspendUser(row)} disabled={working || isCurrentUser} className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed">Suspend</button>}<button type="button" onClick={() => deleteUser(row)} disabled={working || isCurrentUser} className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed">Delete</button></div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Create Personnel</h2>
              <form className="mt-4 grid gap-3" onSubmit={createUser}>
                <input value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} placeholder="Name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} placeholder="Email" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} placeholder="Temporary password" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2"><select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}</select><select value={newUser.departmentId} onChange={(event) => setNewUser({ ...newUser, departmentId: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>
                <button type="submit" disabled={working} className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${working ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{working ? <Spinner /> : 'Create User'}</button>
              </form>
            </article>

            <article className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">System Theme</h2>
              <form className="mt-4 grid gap-3" onSubmit={createTheme}>
                <input value={newTheme.name} onChange={(event) => setNewTheme({ ...newTheme, name: event.target.value })} placeholder="Theme name" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={newTheme.tagline} onChange={(event) => setNewTheme({ ...newTheme, tagline: event.target.value })} placeholder="Tagline" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <input value={newTheme.bannerMessage} onChange={(event) => setNewTheme({ ...newTheme, bannerMessage: event.target.value })} placeholder="Banner message" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <div className="grid grid-cols-3 gap-2"><label className="text-xs text-slate-600">Primary<input type="color" value={newTheme.primaryColor} onChange={(event) => setNewTheme({ ...newTheme, primaryColor: event.target.value })} className="mt-1 h-10 w-full rounded border border-slate-300" /></label><label className="text-xs text-slate-600">Accent<input type="color" value={newTheme.accentColor} onChange={(event) => setNewTheme({ ...newTheme, accentColor: event.target.value })} className="mt-1 h-10 w-full rounded border border-slate-300" /></label><label className="text-xs text-slate-600">Surface<input type="color" value={newTheme.surfaceColor} onChange={(event) => setNewTheme({ ...newTheme, surfaceColor: event.target.value })} className="mt-1 h-10 w-full rounded border border-slate-300" /></label></div>
                <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={newTheme.isActive} onChange={(event) => setNewTheme({ ...newTheme, isActive: event.target.checked })} />Activate immediately</label>
                <button type="submit" disabled={working} className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${working ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{working ? <Spinner /> : 'Create Theme'}</button>
              </form>
              <div className="mt-4 space-y-2">{themes.slice(0, 4).map((theme) => <div key={theme.id} className="rounded-lg border border-slate-200 p-2"><p className="text-sm font-medium text-slate-900">{theme.name}</p><div className="mt-1 flex items-center justify-between"><span className={`rounded-full px-2 py-0.5 text-xs ${theme.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{theme.is_active ? 'Active' : 'Inactive'}</span>{!theme.is_active && <button type="button" onClick={() => activateTheme(theme.id)} disabled={working} className="text-xs font-medium text-blue-700 hover:underline disabled:cursor-not-allowed">Activate</button>}</div></div>)}</div>
            </article>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Broadcast Messages</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={createAnnouncement}>
              <input value={newAnnouncement.title} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, title: event.target.value })} placeholder="Title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              <textarea value={newAnnouncement.message} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, message: event.target.value })} rows={3} placeholder="Message" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              <select value={newAnnouncement.type} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, type: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{ANNOUNCEMENT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              <select value={newAnnouncement.targetScope} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, targetScope: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{TARGET_SCOPES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              {newAnnouncement.targetScope === 'role' && <select value={newAnnouncement.targetRole} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, targetRole: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2">{ROLE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select>}
              {newAnnouncement.targetScope === 'department' && <select value={newAnnouncement.targetDepartmentId} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, targetDepartmentId: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2">{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={newAnnouncement.isPinned} onChange={(event) => setNewAnnouncement({ ...newAnnouncement, isPinned: event.target.checked })} />Pin announcement</label>
              <button type="submit" disabled={working} className={`rounded-lg px-4 py-2 text-sm font-medium text-white sm:col-span-2 ${working ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{working ? <Spinner /> : 'Post Announcement'}</button>
            </form>
            <div className="mt-5 space-y-2">{announcements.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-900">{item.title}</h3><p className="text-xs text-slate-500">{item.target_scope} | {item.type}</p></div><button type="button" onClick={() => deleteAnnouncement(item.id)} disabled={working} className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed">Delete</button></div><p className="mt-1 text-sm text-slate-600">{item.message}</p></article>)}</div>
          </section>
        </div>
      </div>
    </>
  )
}

