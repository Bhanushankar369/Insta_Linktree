import { useState, useEffect, useRef } from 'react'
import './Admin.css'

const API = ''

function Admin() {
  const [authed, setAuthed] = useState(false)
  const [token, setToken] = useState('')
  const [links, setLinks] = useState([])
  const [profile, setProfile] = useState({ name: '', bio: '', icon_url: null })
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [status, setStatus] = useState('')
  const fileRef = useRef()

  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': token }

  const showStatus = (msg) => {
    setStatus(msg)
    setTimeout(() => setStatus(''), 2500)
  }

  const login = async () => {
    const res = await fetch(`${API}/api/admin/verify`, {
      headers: { 'X-Admin-Token': token },
    })
    if (res.ok) {
      setAuthed(true)
      localStorage.setItem('lt-admin-token', token)
      loadData(token)
    } else {
      showStatus('Wrong password')
    }
  }

  const loadData = async (t) => {
    const h = { 'X-Admin-Token': t || token }
    const [linksRes, profileRes] = await Promise.all([
      fetch(`${API}/api/links`).then(r => r.json()),
      fetch(`${API}/api/profile`).then(r => r.json()),
    ])
    setLinks(linksRes)
    setProfile(profileRes)
  }

  useEffect(() => {
    const saved = localStorage.getItem('lt-admin-token')
    if (saved) {
      setToken(saved)
      fetch(`${API}/api/admin/verify`, {
        headers: { 'X-Admin-Token': saved },
      }).then(r => {
        if (r.ok) {
          setAuthed(true)
          loadData(saved)
        }
      })
    }
  }, [])

  const addLink = async () => {
    if (!newTitle.trim() || !newUrl.trim()) return
    await fetch(`${API}/api/admin/links`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: newTitle.trim(), url: newUrl.trim() }),
    })
    setNewTitle('')
    setNewUrl('')
    showStatus('Link added!')
    loadData()
  }

  const deleteLink = async (id) => {
    await fetch(`${API}/api/admin/links/${id}`, { method: 'DELETE', headers })
    showStatus('Link deleted')
    loadData()
  }

  const moveLink = async (index, direction) => {
    const newLinks = [...links]
    const target = index + direction
    if (target < 0 || target >= newLinks.length) return
    ;[newLinks[index], newLinks[target]] = [newLinks[target], newLinks[index]]
    setLinks(newLinks)
    await fetch(`${API}/api/admin/links/reorder`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ order: newLinks.map(l => l.id) }),
    })
  }

  const saveProfile = async () => {
    await fetch(`${API}/api/admin/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: profile.name, bio: profile.bio }),
    })
    showStatus('Profile saved!')
  }

  const uploadIcon = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const form = new FormData()
    form.append('icon', file)
    const res = await fetch(`${API}/api/admin/icon`, {
      method: 'POST',
      headers: { 'X-Admin-Token': token },
      body: form,
    })
    const data = await res.json()
    if (data.icon_url) {
      setProfile({ ...profile, icon_url: data.icon_url })
      showStatus('Icon updated!')
    }
  }

  const logout = () => {
    setAuthed(false)
    setToken('')
    localStorage.removeItem('lt-admin-token')
  }

  if (!authed) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-icon">&#128274;</div>
          <h1>Admin Access</h1>
          <p>Enter your admin password to manage links</p>
          <input
            type="password"
            placeholder="Admin password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            className="admin-input"
          />
          <button onClick={login} className="admin-btn primary">
            Sign In
          </button>
          {status && <div className="admin-status error">{status}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-topbar">
          <h1>Admin Panel</h1>
          <div className="admin-topbar-actions">
            <a href="/" target="_blank" className="admin-btn ghost">View Page</a>
            <button onClick={logout} className="admin-btn ghost danger">Logout</button>
          </div>
        </div>

        {status && <div className="admin-toast">{status}</div>}

        {/* Profile Section */}
        <div className="admin-section">
          <h2>Profile</h2>
          <div className="admin-profile-edit">
            <div className="admin-icon-upload" onClick={() => fileRef.current.click()}>
              {profile.icon_url ? (
                <img src={profile.icon_url} alt="" className="admin-icon-preview" />
              ) : (
                <div className="admin-icon-placeholder">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div className="admin-icon-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={uploadIcon}
                hidden
              />
            </div>
            <div className="admin-profile-fields">
              <div className="admin-field">
                <label>Display Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="admin-input"
                />
              </div>
              <div className="admin-field">
                <label>Bio</label>
                <input
                  type="text"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="admin-input"
                />
              </div>
              <button onClick={saveProfile} className="admin-btn primary">Save Profile</button>
            </div>
          </div>
        </div>

        {/* Add Link */}
        <div className="admin-section">
          <h2>Add Link</h2>
          <div className="admin-add-form">
            <input
              type="text"
              placeholder="Link title (e.g. My YouTube Channel)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              className="admin-input"
            />
            <input
              type="text"
              placeholder="URL (e.g. youtube.com/@yourchannel)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addLink()}
              className="admin-input"
            />
            <button onClick={addLink} className="admin-btn primary">+ Add Link</button>
          </div>
        </div>

        {/* Links List */}
        <div className="admin-section">
          <h2>Your Links ({links.length})</h2>
          {links.length === 0 ? (
            <div className="admin-empty">No links yet. Add your first link above!</div>
          ) : (
            <div className="admin-links-list">
              {links.map((link, i) => (
                <div key={link.id} className="admin-link-row" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="admin-link-info">
                    <span className="admin-link-title">{link.title}</span>
                    <span className="admin-link-url">{link.url}</span>
                  </div>
                  <div className="admin-link-actions">
                    <button
                      className="admin-icon-btn"
                      onClick={() => moveLink(i, -1)}
                      disabled={i === 0}
                      title="Move up"
                    >&#9650;</button>
                    <button
                      className="admin-icon-btn"
                      onClick={() => moveLink(i, 1)}
                      disabled={i === links.length - 1}
                      title="Move down"
                    >&#9660;</button>
                    <button
                      className="admin-icon-btn delete"
                      onClick={() => deleteLink(link.id)}
                      title="Delete"
                    >&#10005;</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin
