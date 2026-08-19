import { useState, useEffect, useRef } from 'react'
import ListenButton from './ListenButton.jsx'
import { generateExplain, generateQuickFacts, AI_CONFIG } from '../services/aiService.js'
import { formatDistance } from '../services/geoService.js'

function useTypewriter(text, speed = 18) {
  const [out, setOut] = useState('')
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setOut('')
    if (!text) return
    const timer = setInterval(() => {
      idx.current += 1
      setOut(text.slice(0, idx.current))
      if (idx.current >= text.length) clearInterval(timer)
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed])

  return out
}

export default function PlaceDetail({ site, isNear, distance, onBack, onOpenMap }) {
  const [mode, setMode] = useState('none') // 'none' | 'thinking' | 'short' | 'full'
  const [text, setText] = useState('')
  const typed = useTypewriter(text, AI_CONFIG.streaming ? AI_CONFIG.typeDelayMs : 1)

  async function run(m) {
    setMode('thinking')
    const t = m === 'short' ? await generateQuickFacts(site) : await generateExplain(site, { mode: m })
    setText(t)
    setMode(m)
  }

  useEffect(() => {
    setMode('none')
    setText('')
  }, [site.id])

  return (
    <section className="detail">
      <button className="btn ghost" onClick={onBack}>← Back</button>

      <div className={`detail-hero ${site.tags[0]}`}>
        <span className="site-initial large">{site.name.charAt(0)}</span>
        {site.unesco && <span className="badge">UNESCO World Heritage</span>}
      </div>

      <header className="detail-head">
        <h2>{site.name}</h2>
        <div className="site-sub">
          <span>{site.hindiName}</span> · <span>{site.era}</span> · <span>{site.builtYear}</span> · <span>{site.area}</span>
        </div>
        <p className="muted">{site.summary}</p>
      </header>

      <div className="geo-status">
        {isNear ? (
          <span className="geo-banner near">
            <span className="pulse-dot" /> You are here! Tap below to trigger the fact.
          </span>
        ) : (
          <span className="geo-banner far">
            📍 {distance != null ? `${formatDistance(distance)} away` : 'Location unknown'} — simulate arrival to trigger audio facts.
          </span>
        )}
      </div>

      {isNear && (
        <div className="trigger-card">
          <h3>⚡ Trigger Audio Fact</h3>
          <p className="muted">You've reached the geofence of {site.name}. Get a quick spoken story.</p>
          <div className="btn-row">
            <ListenButton text={text || site.summary} label="Play Quick Fact" />
            <button className="btn outline" onClick={() => run('short')}>Generate Quick Fact</button>
          </div>
        </div>
      )}

      <div className="ai-card">
        <h3>🧠 Ask the AI Guide</h3>
        <p className="muted">
          Our AI rewrites history into simple words, then reads it aloud — no reading needed.
          <em className="ai-provider"> (engine: {AI_CONFIG.provider === 'mock' ? 'offline demo generator — swap to Gemini/OpenAI in aiService.js' : AI_CONFIG.provider})</em>
        </p>
        <div className="btn-row">
          <button className="btn primary" onClick={() => run('full')} disabled={mode === 'thinking'}>
            {mode === 'thinking' ? 'Thinking…' : '✨ Explain in simple words'}
          </button>
        </div>

        {mode === 'thinking' && <div className="thinking"><span /> <span /> <span /></div>}

        {text && mode !== 'thinking' && (
          <div className="ai-output">
            <p>{typed}{typed.length < text.length && <span className="caret" />}</p>
            <div className="btn-row">
              <ListenButton text={text} label="🔊 Listen to this" />
              <button className="btn ghost small" onClick={() => setText('')}>Clear</button>
            </div>
          </div>
        )}
      </div>

      <div className="facts-card">
        <h3>📜 Quick Facts</h3>
        <div className="facts-grid">
          {site.facts.map((f) => (
            <div key={f.label} className="fact">
              <span className="fact-label">{f.label}</span>
              <span className="fact-value">{f.value}</span>
            </div>
          ))}
        </div>
        <ListenButton text={site.facts.map((f) => `${f.label}. ${f.value}.`).join(' ')} label="🔊 Listen to facts" variant="outline" />
      </div>

      <div className="visit-card">
        <h3>🗺️ Visitor Info</h3>
        <div className="facts-grid">
          {Object.entries(site.visit).map(([k, v]) => (
            <div key={k} className="fact">
              <span className="fact-label">{k.replace(/([A-Z])/g, ' $1')}</span>
              <span className="fact-value">{v}</span>
            </div>
          ))}
        </div>
        <button className="btn outline" onClick={() => onOpenMap(site)}>📍 Open on map</button>
      </div>
    </section>
  )
}