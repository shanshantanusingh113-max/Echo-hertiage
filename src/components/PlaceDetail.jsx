import { useState, useEffect, useRef } from 'react'
import GuideChat from './GuideChat.jsx'
import { streamExplain } from '../services/aiService.js'
import { formatDistance } from '../services/geoService.js'

export default function PlaceDetail({ site, isNear, distance, onBack, onOpenMap, onPlay, t, lang }) {
  const [tab, setTab] = useState('overview') // overview | chat | visit
  const [mode, setMode] = useState('idle') // idle | thinking | done
  const [text, setText] = useState('')
  const runId = useRef(0)

  useEffect(() => { setTab('overview'); setMode('idle'); setText('') }, [site.id])

  async function run() {
    const id = ++runId.current
    setMode('thinking')
    setText('')
    let full = ''
    await streamExplain(site, {
      mode: 'full',
      lang,
      onChunk: (p) => { if (id === runId.current) { full = p; setText(p) } },
    })
    if (id === runId.current) { setText(full); setMode('done') }
  }

  const summary = lang === 'hi' ? (site.summaryHi || site.summary) : site.summary
  const heroImg = site.image
  const factsText = site.facts.map((f) => `${f.label}. ${f.value}.`).join(' ')

  return (
    <section className="detail">
      <button className="btn ghost" onClick={onBack}>← {t('back')}</button>

      <div className="detail-hero">
        {heroImg ? (
          <img src={heroImg} alt={site.name}
            onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <span className="site-initial large">{site.name.charAt(0)}</span>
        )}
        <div className="detail-hero-shade" />
        <div className="detail-hero-text">
          <h2>{site.name}</h2>
          <span>{lang === 'hi' ? site.hindiName : site.era} · {site.area}</span>
        </div>
        {site.unesco && <span className="badge">UNESCO</span>}
      </div>

      <div className="geo-status">
        {isNear ? (
          <span className="geo-banner near"><span className="pulse-dot" /> {t('geoNear', { name: site.name })}</span>
        ) : (
          <span className="geo-banner far">
            📍 {distance != null ? t('geoFar', { dist: formatDistance(distance) }) : t('locationUnknown')}
          </span>
        )}
      </div>

      {isNear && (
        <div className="trigger-card">
          <h3>{t('triggerCardTitle')}</h3>
          <p className="muted">{t('triggerCardText', { name: site.name })}</p>
          <div className="btn-row">
            <button className="btn primary" onClick={() => onPlay({ title: `${t('quickFact')} — ${site.name}`, text: summary, lang })}>
              🔊 {t('playQuickFact')}
            </button>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={tab === 'overview' ? 'tab active' : 'tab'} onClick={() => setTab('overview')}>Overview</button>
        <button className={tab === 'chat' ? 'tab active' : 'tab'} onClick={() => setTab('chat')}>💬 {t('chatTitle')}</button>
        <button className={tab === 'visit' ? 'tab active' : 'tab'} onClick={() => setTab('visit')}>🗺️ {t('visitorTitle')}</button>
      </div>

      {tab === 'overview' && (
        <div className="tab-panel">
          <p className="detail-summary">{summary}</p>

          <div className="btn-row">
            <button className="btn primary" onClick={run} disabled={mode === 'thinking'}>
              {mode === 'thinking' ? `${t('thinking')}…` : `✨ ${t('askGuide')}`}
            </button>
            <button className="btn outline" onClick={() => onPlay({ title: site.name, text: summary, lang })}>
              🔊 {t('listenSummary')}
            </button>
            <button className="btn outline" onClick={() => onPlay({ title: `${site.name} — facts`, text: factsText, lang })}>
              🔊 {t('listenFacts')}
            </button>
          </div>

          {mode === 'thinking' && !text && <div className="thinking"><span /><span /><span /></div>}
          {text && mode === 'thinking' && (
            <div className="ai-output streaming"><p>{text}<span className="caret" /></p></div>
          )}
          {text && mode === 'done' && (
            <div className="ai-output">
              <p>{text}</p>
              <div className="btn-row">
                <button className="btn primary small" onClick={() => onPlay({ title: `${t('askGuide')} — ${site.name}`, text, lang })}>
                  🔊 {t('listenThis')}
                </button>
              </div>
            </div>
          )}

          <div className="facts-card">
            <h3>{t('factsTitle')}</h3>
            <div className="facts-grid">
              {site.facts.map((f) => (
                <div key={f.label} className="fact">
                  <span className="fact-label">{f.label}</span>
                  <span className="fact-value">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'chat' && <div className="tab-panel"><GuideChat site={site} lang={lang} t={t} /></div>}

      {tab === 'visit' && (
        <div className="tab-panel visit-card">
          <div className="facts-grid">
            {Object.entries(site.visit).map(([k, v]) => (
              <div key={k} className="fact">
                <span className="fact-label">{k.replace(/([A-Z])/g, ' $1')}</span>
                <span className="fact-value">{v}</span>
              </div>
            ))}
          </div>
          <div className="btn-row">
            <button className="btn outline" onClick={() => onOpenMap(site)}>📍 {t('openMap')}</button>
          </div>
        </div>
      )}
    </section>
  )
}