# 🔊 EchoHeritage — Audio AI Heritage Guide (Delhi)

A working hackathon prototype that turns any visit to a historical monument into an
**audio-first, AI-powered story**. Built for a <1 week deadline — runs fully in the
browser with zero API keys and no backend.

## 🚀 Run it

```bash
npm install
npm run dev      # open http://localhost:5173
```

Phone demo on same Wi-Fi: Vite prints a network URL (host is enabled in `vite.config.js`).

## 🎬 The 60-second demo script (for your team)

1. **Discover** — browse 13 real Delhi monuments (Red Fort, Qutub Minar, Humayun's Tomb…).
2. Click **Map** → all sites appear as golden pins on OpenStreetMap.
3. In the **SIMULATED GPS** bar, pick *Red Fort* → **"Simulate arrival"**.
   The blue "you" marker flies in, a **dashed geofence circle (500 m)** appears.
4. A **"⚡ Trigger fact"** button lights up (proximity detection fired).
5. Open the detail → **"✨ Explain in simple words"** → the AI guide types out
   a plain-language story → **"🔊 Listen to this"** reads it aloud.

That last step is your differentiator: **the user never reads a wall of text.**

## 🏛️ Architecture

```
src/
├── data/sites.json          # 13 Delhi monuments, facts, coords (easy to extend)
├── services/
│   ├── aiService.js         # 🧠 AI layer — rule-based NOW, plug in real LLM here
│   ├── ttsService.js        # 🔉 Browser SpeechSynthesis (free, offline)
│   └── geoService.js        # 📍 Haversine distance + 500m geofence
├── components/
│   ├── Discover.jsx         # Searchable card grid
│   ├── MapView.jsx          # Leaflet map, markers, geofence circle, user dot
│   ├── PlaceDetail.jsx      # Facts + AI explainer + audio + visitor info
│   ├── ListenButton.jsx     # Reusable text-to-speech button
│   └── SimBar.jsx           # Simulated GPS (demo without traveling)
└── App.jsx                  # View routing + geofence state
```

```
        ┌──────────────────────────────────────────────┐
        │                    BROWSER                   │
        │                                              │
        │  Discover ──► PlaceDetail ◄─── Map (Leaflet) │
        │                   │            ▲             │
        │              aiService.js      │ geofence    │
        │              (mock LLM)        │ check       │
        │                   │            │             │
        │              ttsService.js ◄── SimBar        │
        │              (audio out)      (fake GPS)     │
        └──────────────────────────────────────────────┘
```

Everything is client-side → demo anywhere, works offline, deploys as static files.

## 🧠 The AI integration point (important for judging)

`aiService.js` currently runs an **offline rule-based generator** (no key needed).
To make it a *real* LLM for the final demo, implement `generateExplain` with any of:

- **Google Gemini** — free tier (~1.5k free requests/day) — recommended
- **OpenAI / Groq** — cheap per-request
- **Ollama** — free, runs locally, still "AI" with no network

Only `aiService.js` changes — the UI, audio and map stay identical. Swap point is
marked with a `// ---- REAL LLM SWAP POINT ----` comment.

Suggested prompt (in `aiService.js`):

```
You are a friendly heritage guide. Explain {site.name} to a tourist in
simple, spoken English, 5-7 short sentences, ending with one surprising fact.
```

## 🗺️ Real-map / real-GPS upgrade path

| Now (prototype) | Final product |
|---|---|
| Leaflet + OpenStreetMap | Same, or Google Maps JS SDK for Google-branded tiles |
| Simulated GPS bar | `navigator.geolocation.watchPosition()` + background geofencing |
| 13 hard-coded sites | REST API over a DB seeded from ASI / state tourism open data |
| Mock LLM | Gemini/OpenAI with streaming |
| Browser TTS | Hosted neural TTS (more natural voices, works on phones) |

## 🏗️ Projected 5-day build log

- **Day 1** — Vite scaffold + `sites.json` (13 ASI monuments with verified coords) ✅
- **Day 2** — Leaflet map, markers, geofence circles, sim-GPS ✅
- **Day 3** — AI explainer generator + typewriter effect + audio TTS ✅
- **Day 4** — Dark heritage UI theme + demo flow polish ✅
- **Day 5** — This README + demo rehearsal

## 📜 Data provenance

Facts compiled from publicly available sources: **Archaeological Survey of India (ASI)**,
UNESCO World Heritage listings, NCERT/ASI tourist brochures and heritage archives.
Coordinates verified against OpenStreetMap. Extend by editing `src/data/sites.json` —
each monument needs: `id, name, lat, lng, era, builtYear, story, facts[], visit{}`.

## 🎤 90-second pitch (memorize this)

> "Tourists visit India's monuments and stare at plaques they never read.
> **EchoHeritage** is an audio-first guide: when you walk within 500 metres of a
> site, the app triggers automatically, an AI explains the monument in simple
> words, and reads it to you — hands-free, screen-free. Today we'll show a
> working prototype on Delhi's monuments with simulated GPS and an offline AI
> engine. With a real LLM key and real GPS, it ships in a week."