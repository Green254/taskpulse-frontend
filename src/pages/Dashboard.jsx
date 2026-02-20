import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Toast from '../components/Toast'
import Spinner from '../components/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '../config/api'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
}

const ASSIGNER_ROLES = ['admin', 'manager']

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

const getAssignee = (task) => {
  if (task?.assignedTo && typeof task.assignedTo === 'object') return task.assignedTo
  if (task?.assigned_to && typeof task.assigned_to === 'object') return task.assigned_to
  return null
}

const getAssigneeId = (task) => {
  const relation = getAssignee(task)
  if (relation?.id) return Number(relation.id)
  if (typeof task?.assigned_to === 'number') return task.assigned_to
  if (typeof task?.assigned_to_id === 'number') return task.assigned_to_id
  return null
}

const formatDueDate = (value) => {
  if (!value) return 'No due date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, authFetch, logout } = useAuth()

  const [tasks, setTasks] = useState([])
  const [teamUsers, setTeamUsers] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [activeTheme, setActiveTheme] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    dueDate: '',
    assignedTo: '',
  })

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const hasStoredSession = Boolean(localStorage.getItem('token'))
  const roleNames = Array.isArray(user?.roles) ? user.roles.map((r) => r.name.toLowerCase()) : []
  const canAssignToOthers = roleNames.some((roleName) => ASSIGNER_ROLES.includes(roleName))
  const isAdmin = roleNames.includes('admin')

  const effectiveTeamUsers = useMemo(() => {
    if (teamUsers.length > 0) return teamUsers
    if (user) return [{ id: user.id, name: user.name || user.email }]
    return []
  }, [teamUsers, user])

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'completed').length
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length
    const overdue = tasks.filter((task) => {
      if (!task.due_date || task.status === 'completed') return false
      return new Date(task.due_date) < new Date()
    }).length

    return { total: tasks.length, completed, inProgress, overdue }
  }, [tasks])

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesQuery =
        !q ||
        String(task.title || '').toLowerCase().includes(q) ||
        String(task.description || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [tasks, query, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, teamRes] = await Promise.all([
        authFetch(`${API_URL}/tasks?per_page=100`),
        authFetch(`${API_URL}/team/users`),
      ])

      const tasksPayload = await safeJson(tasksRes)
      const teamPayload = await safeJson(teamRes)

      if (!tasksRes.ok) throw new Error(getApiError(tasksPayload, 'Failed to load tasks'))
      if (!teamRes.ok) throw new Error(getApiError(teamPayload, 'Failed to load team users'))

      setTasks(Array.isArray(tasksPayload?.data) ? tasksPayload.data : [])
      setTeamUsers(Array.isArray(teamPayload) ? teamPayload : [])

      try {
        const [announcementRes, themeRes] = await Promise.all([
          authFetch(`${API_URL}/system/announcements`),
          authFetch(`${API_URL}/system/theme`),
        ])

        const announcementPayload = await safeJson(announcementRes)
        const themePayload = await safeJson(themeRes)

        if (announcementRes.ok) {
          setAnnouncements(Array.isArray(announcementPayload) ? announcementPayload : [])
        }

        if (themeRes.ok) {
          setActiveTheme(themePayload || null)
        }
      } catch {
        setAnnouncements([])
        setActiveTheme(null)
      }
    } catch (error) {
      setToast({ message: error.message || 'Failed to load dashboard.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadData()
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({ ...prev, assignedTo: canAssignToOthers ? prev.assignedTo : String(user.id) }))
  }, [canAssignToOthers, user?.id])

  const handleCreateTask = async (event) => {
    event.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setToast({ message: 'Task title is required.', type: 'error' })
      return
    }

    const payload = {
      title,
      description: form.description.trim() || null,
      status: form.status,
      due_date: form.dueDate || null,
    }

    if (canAssignToOthers && form.assignedTo) payload.assigned_to = Number(form.assignedTo)

    setSubmitting(true)
    try {
      const response = await authFetch(`${API_URL}/tasks`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(getApiError(data, 'Failed to create task'))

      setTasks((prev) => [data, ...prev])
      setForm({ title: '', description: '', status: 'pending', dueDate: '', assignedTo: canAssignToOthers ? '' : String(user.id) })
      setToast({ message: 'Task created.', type: 'success' })
    } catch (error) {
      setToast({ message: error.message || 'Failed to create task.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (taskId, nextStatus) => {
    try {
      const response = await authFetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(getApiError(data, 'Failed to update status'))
      setTasks((prev) => prev.map((task) => (task.id === taskId ? data : task)))
    } catch (error) {
      setToast({ message: error.message || 'Failed to update status.', type: 'error' })
    }
  }

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return

    try {
      const response = await authFetch(`${API_URL}/tasks/${task.id}`, { method: 'DELETE' })
      const data = await safeJson(response)
      if (!response.ok) throw new Error(getApiError(data, 'Failed to delete task'))
      setTasks((prev) => prev.filter((item) => item.id !== task.id))
      setToast({ message: 'Task deleted.', type: 'success' })
    } catch (error) {
      setToast({ message: error.message || 'Failed to delete task.', type: 'error' })
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user && !hasStoredSession) return <Navigate to="/login" replace />
  if (!user) return <div className="min-h-screen grid place-items-center bg-slate-100 text-slate-600">Loading dashboard...</div>

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {activeTheme?.banner_message && (
            <section
              className="rounded-2xl p-4 text-white shadow-sm"
              style={{ backgroundColor: activeTheme.primary_color || '#0f172a' }}
            >
              <p className="text-xs uppercase tracking-wider opacity-80">
                {activeTheme.name || 'Weekly Theme'}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{activeTheme.banner_message}</h2>
              {activeTheme.tagline && <p className="mt-1 text-sm opacity-90">{activeTheme.tagline}</p>}
            </section>
          )}

          <header className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Task Dashboard</h1>
              <p className="text-sm text-slate-600">Signed in as {user.name || user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin" className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100">
                  Admin Panel
                </Link>
              )}
              <Link to="/" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Home</Link>
              <button onClick={handleLogout} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Logout</button>
            </div>
          </header>

          {announcements.length > 0 && (
            <section className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Organization Updates</h2>
              <div className="space-y-2">
                {announcements.map((announcement) => (
                  <article key={announcement.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{announcement.title}</h3>
                      {announcement.is_pinned && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">Pinned</span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 uppercase">{announcement.type}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{announcement.message}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total</p><p className="mt-2 text-3xl font-semibold text-slate-900">{stats.total}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Completed</p><p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.completed}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">In Progress</p><p className="mt-2 text-3xl font-semibold text-blue-600">{stats.inProgress}</p></div>
            <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Overdue</p><p className="mt-2 text-3xl font-semibold text-rose-600">{stats.overdue}</p></div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Create Task</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleCreateTask}>
              <input name="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              <textarea name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2" />
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              {canAssignToOthers ? (
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2">
                  <option value="">Unassigned</option>
                  {effectiveTeamUsers.map((teamUser) => <option key={teamUser.id} value={teamUser.id}>{teamUser.name || teamUser.email}</option>)}
                </select>
              ) : (
                <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:col-span-2">Assignee: {user.name || user.email}</div>
              )}
              <button type="submit" disabled={submitting} className={`rounded-lg px-4 py-2 text-sm font-medium text-white sm:col-span-2 ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{submitting ? <Spinner /> : 'Create Task'}</button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
              <div className="flex gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="all">All</option>
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <button type="button" onClick={loadData} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Refresh</button>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-slate-600">Loading tasks...</div>
            ) : visibleTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-700">No tasks found.</div>
            ) : (
              <div className="space-y-3">
                {visibleTasks.map((task) => {
                  const assigneeRelation = getAssignee(task)
                  const assigneeId = getAssigneeId(task)
                  const assigneeName = assigneeRelation?.name || effectiveTeamUsers.find((u) => u.id === assigneeId)?.name || (assigneeId ? `User #${assigneeId}` : 'Unassigned')

                  return (
                    <article key={task.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGE[task.status] || 'bg-slate-200 text-slate-700'}`}>{STATUS_OPTIONS.find((s) => s.value === task.status)?.label || task.status}</span>
                      </div>
                      {task.description && <p className="text-sm text-slate-600">{task.description}</p>}
                      <p className="text-xs text-slate-500">Assignee: {assigneeName} | Due: {formatDueDate(task.due_date)}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <select value={task.status} onChange={(e) => handleUpdateStatus(task.id, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-xs">
                          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                        <button type="button" onClick={() => handleDelete(task)} className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">Delete</button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
