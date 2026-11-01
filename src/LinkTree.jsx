import { useState, useEffect } from 'react'
import './LinkTree.css'

const API = ''

function LinkTree() {
  const [links, setLinks] = useState([])
  const [profile, setProfile] = useState({ name: '', bio: '', icon_url: null })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/links`).then(r => r.json()),
      fetch(`${API}/api/profile`).then(r => r.json()),
    ]).then(([linksData, profileData]) => {
      setLinks(linksData)
      setProfile(profileData)
      setLoaded(true)
    })
  }, [])

  return (
    <div className="lt-page">
      {/* Animated background blobs */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-blob blob-3" />

      <div className={`lt-content ${loaded ? 'visible' : ''}`}>
        {/* Profile */}
        <div className="lt-profile">
          <div className="lt-avatar-ring">
            {profile.icon_url ? (
              <img src={profile.icon_url} alt={profile.name} className="lt-avatar-img" />
            ) : (
              <div className="lt-avatar-fallback">
                {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          <h1 className="lt-name">{profile.name}</h1>
          {profile.bio && <p className="lt-bio">{profile.bio}</p>}
        </div>

        {/* Links */}
        <div className="lt-links">
          {links.length === 0 && loaded && (
            <p className="lt-empty">No links yet</p>
          )}
          {links.map((link, i) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="lt-link-card"
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <span className="lt-link-text">{link.title}</span>
              <svg className="lt-link-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="lt-footer">
          <span className="lt-footer-dot" />
          <span>My Linktree</span>
        </div>
      </div>
    </div>
  )
}

export default LinkTree
