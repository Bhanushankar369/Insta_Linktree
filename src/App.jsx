import { useState, useEffect } from 'react'
import './App.css'

const DEFAULT_PROFILE = {
  name: 'Your Name',
  bio: 'Your bio goes here',
}

function App() {
  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem('linktree-links')
    return saved ? JSON.parse(saved) : []
  })

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('linktree-profile')
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE
  })

  const [showAdmin, setShowAdmin] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

  useEffect(() => {
    localStorage.setItem('linktree-links', JSON.stringify(links))
  }, [links])

  useEffect(() => {
    localStorage.setItem('linktree-profile', JSON.stringify(profile))
  }, [profile])

  const addLink = () => {
    if (!newTitle.trim() || !newUrl.trim()) return
    let url = newUrl.trim()
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    setLinks([...links, { id: Date.now(), title: newTitle.trim(), url }])
    setNewTitle('')
    setNewUrl('')
  }

  const deleteLink = (id) => {
    setLinks(links.filter((link) => link.id !== id))
  }

  const moveLink = (index, direction) => {
    const newLinks = [...links]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newLinks.length) return
    ;[newLinks[index], newLinks[targetIndex]] = [newLinks[targetIndex], newLinks[index]]
    setLinks(newLinks)
  }

  return (
    <>
      {/* Public Linktree Page */}
      <div className="linktree-page">
        <div className="profile-section">
          <div className="profile-avatar">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="profile-name">{profile.name}</h1>
          <p className="profile-bio">{profile.bio}</p>
        </div>

        <div className="links-container">
          {links.length === 0 ? (
            <p className="no-links">No links yet. Click the gear button to add some!</p>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link-card"
              >
                {link.title}
              </a>
            ))
          )}
        </div>
      </div>

      {/* Admin Toggle Button */}
      <button className="admin-toggle" onClick={() => setShowAdmin(true)} title="Admin Panel">
        &#9881;
      </button>

      {/* Admin Panel Overlay */}
      {showAdmin && (
        <div className="admin-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowAdmin(false)
        }}>
          <div className="admin-panel">
            <div className="admin-header">
              <h2>Admin Panel</h2>
              <button className="close-btn" onClick={() => setShowAdmin(false)}>
                &#10005;
              </button>
            </div>

            {/* Profile Settings */}
            <div className="settings-section">
              <h3>Profile</h3>
              <div className="input-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="input-group">
                <label>Bio</label>
                <input
                  type="text"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Short bio"
                />
              </div>
            </div>

            {/* Add Link */}
            <div className="settings-section">
              <h3>Add New Link</h3>
              <div className="add-link-form">
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Title (e.g. My YouTube)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLink()}
                  />
                  <input
                    type="text"
                    placeholder="URL (e.g. youtube.com/@channel)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLink()}
                  />
                </div>
                <button className="add-btn" onClick={addLink}>
                  + Add Link
                </button>
              </div>
            </div>

            {/* Existing Links */}
            <div className="settings-section">
              <h3>Your Links</h3>
              {links.length === 0 ? (
                <div className="empty-state">No links added yet</div>
              ) : (
                <div className="admin-links-list">
                  {links.map((link, index) => (
                    <div key={link.id} className="admin-link-item">
                      <div className="admin-link-info">
                        <div className="admin-link-title">{link.title}</div>
                        <div className="admin-link-url">{link.url}</div>
                      </div>
                      <div className="admin-link-actions">
                        <button
                          className="icon-btn up"
                          onClick={() => moveLink(index, -1)}
                          disabled={index === 0}
                          title="Move up"
                        >
                          &#9650;
                        </button>
                        <button
                          className="icon-btn down"
                          onClick={() => moveLink(index, 1)}
                          disabled={index === links.length - 1}
                          title="Move down"
                        >
                          &#9660;
                        </button>
                        <button
                          className="icon-btn delete"
                          onClick={() => deleteLink(link.id)}
                          title="Delete"
                        >
                          &#128465;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
