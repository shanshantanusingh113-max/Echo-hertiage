import { useState, useEffect, useRef } from 'react'
import { speak, stopSpeaking } from '../services/ttsService.js'

export default function ListenButton({ text, label = 'Listen', variant = 'primary', disabled, onStart, onEnd }) {
  const [speaking, setSpeaking] = useState(false)
  const controllerRef = useRef(null)

  useEffect(() => () => stopSpeaking(), [])

  async function toggle() {
    if (speaking) {
      controllerRef.current?.stop()
      setSpeaking(false)
      onEnd?.()
      return
    }
    if (!text) return
    stopSpeaking()
    setSpeaking(true)
    onStart?.()
    controllerRef.current = speak(text)
    await controllerRef.current.done
    setSpeaking(false)
    onEnd?.()
  }

  return (
    <button className={`btn ${variant} ${speaking ? 'speaking' : ''}`} onClick={toggle} disabled={disabled}>
      <span className="btn-icon">{speaking ? '⏹' : '🔊'}</span>
      {speaking ? 'Stop' : label}
    </button>
  )
}