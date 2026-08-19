/**
 * ttsService.js — Text-To-Speech wrapper over the browser SpeechSynthesis API.
 * Supports language selection (en/hi) and progress callbacks for a player UI.
 */

let cachedVoices = []

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  cachedVoices = window.speechSynthesis.getVoices() || []
  return cachedVoices
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

export function getVoices() {
  return loadVoices()
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickVoice(lang) {
  const voices = loadVoices()
  const want = lang === 'hi' ? 'hi' : 'en'
  if (want === 'hi') {
    return (
      voices.find((v) => /hi[-_]?(IN)/i.test(v.lang)) ||
      voices.find((v) => /hi/i.test(v.lang)) ||
      null
    )
  }
  return (
    voices.find((v) => /en[-_]?(IN|GB)/i.test(v.lang)) ||
    voices.find((v) => /Google UK English Female/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    null
  )
}

/**
 * Speak a string. Returns a controller: { stop, done, isSpeaking }.
 * @param {string} text
 * @param {{lang?: 'en'|'hi', rate?: number, pitch?: number, onProgress?: (charsDone:number, total:number)=>void}} [opts]
 */
export function speak(text, opts = {}) {
  const noop = { stop: () => {}, done: Promise.resolve(), isSpeaking: () => false }
  if (!isSpeechSupported() || !text) return noop

  const synth = window.speechSynthesis
  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const lang = opts.lang === 'hi' ? 'hi-IN' : 'en-IN'
  utterance.lang = lang
  utterance.rate = opts.rate ?? 0.95
  utterance.pitch = opts.pitch ?? 1

  const voice = pickVoice(opts.lang)
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  }

  const total = text.length
  let done = false
  let resolveDone
  const donePromise = new Promise((r) => { resolveDone = r })
  const finish = () => { if (!done) { done = true; resolveDone() } }

  utterance.onboundary = (e) => {
    opts.onProgress?.(Math.min(e.charIndex ?? 0, total), total)
  }
  utterance.onend = () => { opts.onProgress?.(total, total); finish() }
  utterance.onerror = () => { opts.onProgress?.(total, total); finish() }

  synth.speak(utterance)

  return {
    stop: () => {
      synth.cancel()
      finish()
    },
    done: donePromise,
    isSpeaking: () => !done,
  }
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}