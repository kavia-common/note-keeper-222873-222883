import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api'

const theme = {
  primary: '#2563EB',
  secondary: '#F59E0B',
  error: '#EF4444',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827'
};

function AppBar({ onLogout, loggedIn }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, rgba(37,99,235,0.06), rgba(249,250,251,0))`,
      borderBottom: '1px solid #e5e7eb',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ fontWeight: 800, color: theme.primary, letterSpacing: 0.2 }}>
        Notes
      </div>
      {loggedIn && (
        <button onClick={onLogout} style={buttonStyle('outline')} aria-label="Logout">
          Logout
        </button>
      )}
    </div>
  )
}

function buttonStyle(variant = 'primary') {
  const base = {
    padding: '8px 12px',
    borderRadius: 10,
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'all .2s ease',
    fontWeight: 600,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
  }
  if (variant === 'primary') {
    return { ...base, background: theme.primary, color: 'white' }
  }
  if (variant === 'danger') {
    return { ...base, background: theme.error, color: 'white' }
  }
  return { ...base, background: theme.surface, color: theme.text, borderColor: '#e5e7eb' }
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: theme.surface,
      border: '1px solid #e5e7eb',
      borderRadius: 14,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03)',
      padding: 16,
      ...style
    }}>
      {children}
    </div>
  )
}

function LoginView({ onLogin }) {
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('demo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.login(username, password)
      onLogin()
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '96px auto', padding: '0 16px' }}>
      <Card style={{ padding: 24 }}>
        <h2 style={{ marginTop:0, marginBottom: 4, color: theme.text }}>Welcome</h2>
        <p style={{ color: '#374151', marginTop:0 }}>Sign in to manage your notes.</p>
        <form onSubmit={submit} style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color:'#374151' }}>Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} required
              style={inputStyle} placeholder="Enter username" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color:'#374151' }}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={inputStyle} placeholder="Enter password" />
          </div>
          {error && <div style={{ color: theme.error, marginBottom: 8 }}>{error}</div>}
          <button type="submit" style={buttonStyle('primary')} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </Card>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  outline: 'none',
  fontSize: 14,
  transition: 'border-color .2s ease, box-shadow .2s ease'
}

function NotesView() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.listNotes()
      setNotes(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const sorted = useMemo(() => {
    return [...notes].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  }, [notes])

  async function submitNew(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await api.createNote(title, content)
      setNotes(n => [created, ...n])
      setTitle('')
      setContent('')
    } catch (err) {
      alert(err.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(note) {
    setEditingId(note.id)
    setTitle(note.title)
    setContent(note.content)
  }

  async function saveEdit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await api.updateNote(editingId, { title, content })
      setNotes(ns => ns.map(n => n.id === editingId ? updated : n))
      setEditingId('')
      setTitle('')
      setContent('')
    } catch (err) {
      alert(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this note?')) return
    try {
      await api.deleteNote(id)
      setNotes(ns => ns.filter(n => n.id !== id))
    } catch (err) {
      alert(err.message || 'Delete failed')
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        <Card>
          <h3 style={{ marginTop:0, color: theme.text }}>{editingId ? 'Edit Note' : 'Create Note'}</h3>
          <form onSubmit={editingId ? saveEdit : submitNew}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color:'#374151' }}>Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 6, color:'#374151' }}>Content</label>
              <textarea value={content} onChange={e=>setContent(e.target.value)} required
                style={{ ...inputStyle, minHeight: 140, fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={buttonStyle('primary')} disabled={saving}>
                {saving ? 'Saving...' : (editingId ? 'Save' : 'Add')}
              </button>
              {editingId && (
                <button type="button" style={buttonStyle('outline')} onClick={() => { setEditingId(''); setTitle(''); setContent(''); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>
        <div>
          <Card>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0, color: theme.text }}>Your Notes</h3>
              <button style={buttonStyle('outline')} onClick={load} aria-label="Refresh notes">Refresh</button>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div style={{ color: theme.error }}>{error}</div>
            ) : sorted.length === 0 ? (
              <div>No notes yet. Create one!</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {sorted.map(n => (
                  <Card key={n.id} style={{ padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{n.title}</div>
                        <div style={{ color: '#374151', marginTop: 4, whiteSpace: 'pre-wrap' }}>{n.content}</div>
                        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>
                          Updated {new Date(n.updated_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                        <button style={buttonStyle('outline')} onClick={() => startEdit(n)}>Edit</button>
                        <button style={buttonStyle('danger')} onClick={() => remove(n.id)}>Delete</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(!!api.getToken())

  async function handleLogout() {
    await api.logout()
    setLoggedIn(false)
  }

  return (
    <div style={{ background: theme.background, minHeight: '100vh' }}>
      <AppBar onLogout={handleLogout} loggedIn={loggedIn} />
      {loggedIn ? (
        <NotesView />
      ) : (
        <LoginView onLogin={() => setLoggedIn(true)} />
      )}
    </div>
  )
}
