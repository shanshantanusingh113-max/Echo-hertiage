/**
 * aiService.js — the AI/LLM layer of EchoHeritage.
 *
 * CURRENT MODE: "mock" — a rule-based generator that writes simple-language
 * explainers from structured facts. No API key, no network, works offline.
 *
 * SWAP TO REAL LLM: implement `generateExplain` below by calling your favourite
 * LLM (Gemini free tier, OpenAI, Ollama local model, etc.) and keep the same
 * function signature. Nothing else in the app needs to change.
 */

export const AI_CONFIG = {
  provider: 'mock', // change to 'gemini' | 'openai' | 'ollama' when a key/model is available
  model: 'n/a',
  apiKey: '', // paste your key here when available
  streaming: true, // simulate typing effect for the demo "wow"
  typeDelayMs: 18,
}

const SIMPLE_WORDS = {
  emperor: 'royal king',
  emperors: 'royal kings',
  dynasty: 'ruling family',
  citadel: 'strong fort',
  minaret: 'tall tower of a mosque',
  tomb: 'grand burial building',
  mausoleum: 'grand burial building',
  baoli: 'ancient stepped well',
  madrasa: 'old Islamic college',
  reservoir: 'big water storage',
  architecture: 'building style',
  monument: 'ancient building',
  heritage: 'historical treasure',
  archaeological: 'related to digging up history',
  constructed: 'built',
  founded: 'started',
  commissioned: 'ordered to be built',
  renowned: 'very famous',
  magnificent: 'grand and beautiful',
  century: 'a period of one hundred years',
  fortress: 'giant protective fort',
  pristine: 'perfect and untouched',
}

const OPENERS = [
  (site) => `Let me tell you about ${site.name}.`,
  (site) => `Here's the story of ${site.name}.`,
  (site) => `So, what is ${site.name}? Here is the easy version.`,
  (site) => `Welcome to ${site.name}! Here's what you should know.`,
]

const MIDDLES = [
  (site) => `This place was built in ${site.builtYear}, during the ${site.era}.`,
  (site) => `It was built in the year ${site.builtYear}.`,
  (site) => `${site.builder} was behind this masterpiece back in ${site.builtYear}.`,
]

const SIMPLIFYERS = [
  (site) => `In simple words, it's a ${site.tags[0]} that visitors love.`,
  (site) => `Think of it as a giant storybook made of stone.`,
  (site) => `It's basically a piece of Indian history you can walk through.`,
]

const CLOSERS = [
  (site) => `And here's a fun secret: ${site.funFact}`,
  (site) => `One more cool thing: ${site.funFact}`,
  (site) => `Did you know? ${site.funFact}`,
]

function simplify(text) {
  let out = text
  for (const [word, simpler] of Object.entries(SIMPLE_WORDS)) {
    out = out.replace(new RegExp(`\\b${word}\\b`, 'gi'), simpler)
  }
  return out
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Generate a simple-language, audio-friendly explanation for a site.
 * @param {object} site  A monument object from sites.json
 * @param {{ mode?: 'short'|'full' }} [opts]
 * @returns {Promise<string>}
 */
export async function generateExplain(site, opts = {}) {
  const mode = opts.mode || 'full'

  // ---- REAL LLM SWAP POINT -------------------------------------------------
  // Example (Gemini): fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${AI_CONFIG.apiKey}`, {...})
  // then return the generated text. Keep the same return shape (a string).
  // -------------------------------------------------------------------------

  await sleep(600) // simulate model thinking time

  const parts = [
    pick(OPENERS)(site),
    pick(MIDDLES)(site),
    simplify(site.story).trim(),
  ]

  if (mode !== 'short') {
    parts.push(pick(SIMPLIFYERS)(site))
    parts.push(pick(CLOSERS)(site))
  }

  return parts.join(' ')
}

/** Generate ultra-short "just the highlights" version for quick audio. */
export async function generateQuickFacts(site) {
  await sleep(350)
  const facts = site.facts
    .slice(0, 3)
    .map((f) => `${f.label}: ${f.value}.`)
    .join(' ')
  return `${site.name} in one breath. ${facts} ${pick(CLOSERS)(site)}`
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}