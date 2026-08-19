import { useState } from 'react'

export default function Discover({ sites, onOpen, t, lang }) {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('all')

  const tags = ['all', ...new Set(sites.flatMap((s) => s.tags))]

  const filtered = sites.filter((s) => {
    const q = query.trim().toLowerCase()
    const matchQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.area.toLowerCase().includes(q) ||
      s.era.toLowerCase().includes(q) ||
      s.hindiName.includes(query.trim()) ||
      (lang === 'hi' && (s.summaryHi || '').includes(query.trim()))
    const matchTag = tag === 'all' || s.tags.includes(tag)
    return matchQuery && matchTag
  })

  return (
    <section className="discover">
      <div className="hero glass">
        <div className="hero-text">
          <span className="hero-kicker">🎧 {t('tagline')}</span>
          <h1>{t('discoverTitle')}</h1>
          <p>{t('discoverSubtitle')}</p>
          <div className="search-row">
            <input
              className="search-input"
              type="search"
              placeholder={t('searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="tag-row">
            {tags.map((tg) => (
              <button
                key={tg}
                className={`chip ${tag === tg ? 'chip-active' : ''}`}
                onClick={() => setTag(tg)}
              >
                {tg === 'all' ? t('allTag') : tg}
              </button>
            ))}
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat"><b>{sites.length}</b><span>Monuments</span></div>
          <div className="stat"><b>{sites.filter((s) => s.unesco).length}</b><span>UNESCO</span></div>
          <div className="stat"><b>1000+</b><span>Years of history</span></div>
        </div>
      </div>

      <div className="grid">
        {filtered.map((site) => (
          <article key={site.id} className="site-card" onClick={() => onOpen(site)}>
            <div className="site-photo">
              {site.image ? (
                <img src={site.image} alt={site.name} loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none' }} />
              ) : null}
              <span className="site-initial">{site.name.charAt(0)}</span>
              {site.unesco && <span className="badge">UNESCO</span>}
              <div className="site-photo-shade" />
              <div className="site-photo-title">
                <h3>{site.name}</h3>
                <span>{lang === 'hi' ? (site.summaryHi || site.summary) : site.summary}</span>
              </div>
            </div>
            <div className="site-body">
              <div className="site-sub">
                <span>{site.era}</span> · <span>{site.builtYear}</span> · <span>{site.area}</span>
              </div>
              <div className="site-tags">
                {site.tags.slice(0, 3).map((tg) => (
                  <span key={tg} className="mini-chip">{tg}</span>
                ))}
                <span className="mini-chip audio">🔊 audio guide</span>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <p className="muted">No monuments match your search.</p>}
      </div>
    </section>
  )
}