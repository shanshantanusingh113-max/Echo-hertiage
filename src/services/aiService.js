/**
 * aiService.js — the AI/LLM layer of EchoHeritage.
 *
 * CURRENT MODE: "mock" — rule-based generator. No API key, no network.
 *
 * SWAP TO REAL LLM: implement `generateExplain` / `streamExplain` / `askGuide`
 * with your favourite provider (Gemini free tier, OpenAI, Ollama). Keep the same
 * signatures — nothing else in the app changes.
 */

export const AI_CONFIG = {
  provider: 'mock', // 'mock' | 'gemini' | 'openai' | 'ollama'
  model: 'n/a',
  apiKey: '',
  streaming: true,
  typeDelayMs: 18,
}

const EN_OPENERS = [
  (s) => `Let me tell you about ${s.name}.`,
  (s) => `Here's the story of ${s.name}.`,
  (s) => `So, what is ${s.name}? Here is the easy version.`,
  (s) => `Welcome to ${s.name}! Here's what you should know.`,
]
const HI_OPENERS = [
  (s) => `चलिए आपको ${s.name} के बारे में बताते हैं।`,
  (s) => `${s.name} की कहानी सुनिए।`,
  (s) => `${s.name} क्या है? इसे आसान शब्दों में समझिए।`,
  (s) => `${s.name} में आपका स्वागत है!`,
]
const EN_MIDDLES = [
  (s) => `This place was built in ${s.builtYear}, during the ${s.era}.`,
  (s) => `It was built in the year ${s.builtYear}.`,
  (s) => `${s.builder} was behind this masterpiece back in ${s.builtYear}.`,
]
const HI_MIDDLES = [
  (s) => `यह स्थान ${s.era} के समय, ${s.builtYear} में बना था।`,
  (s) => `इसे ${s.builtYear} में बनवाया गया था।`,
  (s) => `${s.builder} ने ही इस भव्य इमारत को बनवाया था।`,
]
const EN_CLOSERS = [
  (s) => `And here's a fun secret: ${s.funFact}`,
  (s) => `One more cool thing: ${s.funFact}`,
  (s) => `Did you know? ${s.funFact}`,
]
const HI_CLOSERS = [
  (s) => `और एक मज़ेदार बात: ${s.funFact}`,
  (s) => `क्या आप जानते हैं? ${s.funFact}`,
  (s) => `एक और दिलचस्प बात: ${s.funFact}`,
]

const SIMPLE_WORDS = {
  emperor: 'royal king', emperors: 'royal kings', dynasty: 'ruling family',
  citadel: 'strong fort', minaret: 'tall tower of a mosque', tomb: 'grand burial building',
  mausoleum: 'grand burial building', baoli: 'ancient stepped well', madrasa: 'old Islamic college',
  reservoir: 'big water storage', architecture: 'building style', monument: 'ancient building',
  heritage: 'historical treasure', archaeological: 'dug up from history', constructed: 'built',
  founded: 'started', commissioned: 'ordered to be built', renowned: 'very famous',
  magnificent: 'grand and beautiful', century: 'a period of one hundred years',
  fortress: 'giant protective fort', pristine: 'perfect and untouched',
}

function simplify(text) {
  let out = text
  for (const [word, simpler] of Object.entries(SIMPLE_WORDS)) {
    out = out.replace(new RegExp(`\\b${word}\\b`, 'gi'), simpler)
  }
  return out
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function buildText(site, lang, mode) {
  const O = lang === 'hi' ? HI_OPENERS : EN_OPENERS
  const M = lang === 'hi' ? HI_MIDDLES : EN_MIDDLES
  const C = lang === 'hi' ? HI_CLOSERS : EN_CLOSERS
  const parts = [pick(O)(site), pick(M)(site)]
  if (lang === 'hi') {
    parts.push(site.summaryHi || site.summary)
  } else {
    parts.push(simplify(site.story).trim())
  }
  if (mode !== 'short') {
    parts.push(lang === 'hi' ? `सीधे शब्दों में: ${site.summaryHi || site.summary}` : `In simple words: ${site.summary}`)
    parts.push(pick(C)(site))
  }
  return parts.join(' ')
}

function buildQuick(site, lang) {
  const C = lang === 'hi' ? HI_CLOSERS : EN_CLOSERS
  const facts = site.facts.slice(0, 3).map((f) => `${f.label}: ${f.value}.`).join(' ')
  const header = lang === 'hi' ? `${site.name} एक झलक में।` : `${site.name} in one breath.`
  return `${header} ${facts} ${pick(C)(site)}`
}

/** Full generated explanation. */
export async function generateExplain(site, { mode = 'full', lang = 'en' } = {}) {
  await sleep(500) // simulated model latency
  return mode === 'short' ? buildQuick(site, lang) : buildText(site, lang, mode)
}

/** Streaming generator — calls onChunk with growing partial strings. */
export async function streamExplain(site, { mode = 'full', lang = 'en', onChunk, delay = 16 } = {}) {
  const full = await generateExplain(site, { mode, lang })
  const step = Math.max(3, Math.round(full.length / 120))
  for (let i = 0; i <= full.length; i += step) {
    onChunk(full.slice(0, i))
    await sleep(delay)
  }
  onChunk(full)
  return full
}

/**
 * Chat answer generator (mock). Matches simple keywords to pick a relevant fact.
 * Replace with a real LLM call for follow-up questions.
 */
export async function askGuide(question, site, lang = 'en') {
  await sleep(600)
  const q = question.toLowerCase()
  const hi = lang === 'hi'
  const fact = (label) => site.facts.find((f) => f.label.toLowerCase().includes(label))

  if (/(who|build|bana|किसने|कौन)/.test(q)) {
    return hi
      ? `${site.name} को ${site.builder} ने बनवाया था। इसे ${site.builtYear} में पूरा किया गया।`
      : `${site.name} was built by ${site.builder}, finished around ${site.builtYear}.`
  }
  if (/(when|year|kab|कब|कितना पुराना)/.test(q)) {
    return hi
      ? `इसकी नींव ${site.builtYear} में रखी गई थी। यह ${site.era} की धरोहर है।`
      : `It dates back to ${site.builtYear}, from the ${site.era}.`
  }
  if (/(height|tall|size|big|ऊँच|कितना बड़ा)/.test(q) && (fact('Height') || fact('Size') || fact('Capacity'))) {
    const f = fact('Height') || fact('Size') || fact('Capacity')
    return hi ? `${f.label}: ${f.value}।` : `${f.label}: ${f.value}.`
  }
  if (/(secret|fun|did you know|rahasya|रहस्य|मज़ेदार)/.test(q)) {
    return hi ? `एक रहस्य: ${site.funFact}` : `Here's a secret: ${site.funFact}`
  }
  if (/(entry|ticket|fee|money|price|टिकट|प्रवेश|पैसा)/.test(q) && site.visit?.fee) {
    return hi ? `प्रवेश शुल्क: ${site.visit.fee}। ${site.visit.open}।` : `Entry: ${site.visit.fee}. ${site.visit.open}.`
  }
  if (/(open|time|hour|kab|समय|खुलता)/.test(q) && site.visit?.time) {
    return hi ? `खुलने का समय: ${site.visit.time}।` : `Opening hours: ${site.visit.time}.`
  }
  if (/(eat|food|restaurant|khaana|खाना|कहाँ खाऊं)/.test(q)) {
    return hi
      ? `आस-पास के बाज़ारों में दिल्ली के मशहूर व्यंजन मिलेंगे — पराठे, चाट और क़ुल्फी!`
      : `Nearby bazaars serve Delhi's best street food — parathas, chaat and kulfi!`
  }
  if (/(photo|pictures|photo|फोटो)/.test(q)) {
    return hi ? `सुबह या शाम की रोशनी में सबसे अच्छी फोटो बनती है!` : `Best photos happen in morning or golden-hour light!`
  }
  return hi
    ? `${site.name} के बारे में और बताऊँ? इतिहास, वास्तुकला या घूमने का सही समय — कोई भी पूछें।`
    : `I can tell you more about ${site.name} — history, architecture, best time to visit. What would you like to know?`
}