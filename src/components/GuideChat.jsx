import { useState, useRef, useEffect } from 'react'
import { askGuide } from '../services/aiService.js'

export default function GuideChat({ site, lang, t }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    setMessages([])
    setStreamingText('')
  }, [site.id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText, busy])

  async function send(e) {
    e?.preventDefault()
    const q = input.trim()
    if (!q || busy) return
    setMessages((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setBusy(true)
    setStreamingText('')
    const full = await askGuide(q, site, lang)
    let i = 0
    const step = 4
    const id = setInterval(() => {
      i += step
      setStreamingText(full.slice(0, i))
      if (i >= full.length) {
        clearInterval(id)
        setMessages((m) => [...m, { role: 'guide', text: full }])
        setStreamingText('')
        setBusy(false)
      }
    }, 14)
  }

  return (
    <div className="chat glass">
      <div className="chat-head">
        <span className="chat-avatar">🧑‍🏫</span>
        <div>
          <strong>{t('chatTitle')}</strong>
          <small className="muted">{t('chatHint')}</small>
        </div>
      </div>
      <div className="chat-body" ref={scrollRef}>
        {messages.length === 0 && !busy && (
          <div className="chat-welcome">{t('chatWelcome')}</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.text}</div>
        ))}
        {busy && streamingText && <div className="msg guide">{streamingText}<span className="caret" /></div>}
        {busy && !streamingText && <div className="msg guide thinking-msg"><span className="dots" /></div>}
      </div>
      <form className="chat-input" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chatPlaceholder')}
          disabled={busy}
        />
        <button className="btn primary small" disabled={busy || !input.trim()}>{t('chatSend')}</button>
      </form>
    </div>
  )
}