import { useState } from 'react'

export default function Discover({ sites, onOpen }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('All')

  const tags = ['All', ...new Set(sites.flatMap((s) => s.tags))]

  const filtered = sites.filter((s) => {
    const q = query.trim().toLowerCase()
    const matchQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.area.toLowerCase().includes(q) ||
      s.era.toLowerCase().includes(q) ||
      s.hindiName.includes(query.trim())
    const matchTag = tag === 'All' || s.tags.includes(tag)
    return matchQuery && matchTag
  })

  return (
    <section className="discover">
      <div className="discover-head">
        <h2>Discover Delhi's Heritage</h2>
        <p className="muted">
          Tap a monument to hear its story in simple words. {sites.length} UNESCO and ASI sites curated for you.
        </p>
        <div className="search-row">
          <input
            className="search-input"
            type="search"
            placeholder="Search monuments, areas, eras…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="tag-row">
            {tags.map((t) => (
              <button key={t} className={`chip ${tag === t ? 'chip-active' : ''}`} onClick={() => setTag(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid">
        {filtered.map((site) => (
          <article key={site.id} className="site-card" onClick={() => onOpen(site)}>
            <div className="site-banner">
              <span className="site-initial">{site.name.charAt(0)}</span>
              {site.unesco && <span className="badge">UNESCO</span>}
            </div>
            <div className="site-body">
              <h3>{site.name}</h3>
              <div className="site-sub">
                <span>{site.era}</span> · <span>{site.builtYear}</span> · <span>{site.area}</span>
              </div>
              <p className="site-summary">{site.summary}</p>
              <div className="site-tags">
                {site.tags.slice(0, 3).map((t) => (
                  <span key={t} className="mini-chip">{t}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p className="muted">No monuments match your search.</p>}
      </div>
    </section>
  )
}