/**
 * ttsService.js — Text-To-Speech wrapper using the browser's built-in
 * SpeechSynthesis API. Zero dependencies, zero keys, works offline.
 * Prefers an Indian-English voice when available.
 */

let cachedVoice = null

function findVoice() {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis?.getVoices() || []
  const preferred = [
    'Google हिन्दी',
    'Microsoft Heera',
    'Google UK English Female',
    'Google US English',
    'en-IN',
    'en-GB',
    'en-US',
  ]
  cachedVoice =
    voices.find((v) => preferred.includes(v.name)) ||
    voices.find((v) => /en[-_]?(IN|GB)/i.test(v.lang)) ||
    voices.find((v) => /en/i.test(v.lang)) ||
    null
  return cachedVoice
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
    findVoice()
  }
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/**
 * Speak a string aloud. Returns an object with stop() and a done Promise.
 * @param {string} text
 * @param {{rate?: number, pitch?: number, voice?: SpeechSynthesisVoice}} [opts]
 */
export function speak(text, opts = {}) {
  if (!isSpeechSupported()) {
    return { stop: () => {}, done: Promise.resolve() }
  }

  const synth = window.speechSynthesis
  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = opts.rate ?? 0.95
  utterance.pitch = opts.pitch ?? 1
  utterance.lang = 'en-IN'

  const voice = opts.voice || findVoice()
  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang
  }

  const done = new Promise((resolve) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()
  })

  synth.speak(utterance)

  return {
    stop: () => {
      synth.cancel()
      resolvePromise(done)
    },
    done,
  }
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel()
}

function resolvePromise(p) {
  p.then(() => {})
}