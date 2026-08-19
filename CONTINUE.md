# EchoHeritage — Continuation Handoff

Use this file to resume work exactly where it stopped. Everything below is the
current state of the project, decisions already made, and what comes next.

---

## What the project is

**EchoHeritage** — an audio-first AI heritage guide for hackathon demo. A React
single-page app that shows Delhi's ASI monuments on a map, triggers a spoken
"fact" when the user enters a 500 m geofence, generates simple-language stories
via an offline AI layer, and reads them aloud with browser TTS.

Stack: **React 18 + Vite 5 + Leaflet + OpenStreetMap + CSS** (no Tailwind, no
backend, no API keys).

## Current status (upgrade COMPLETE + deployed)

- [x] 13 Delhi monuments in `src/data/sites.json` — every site now has `summaryHi` (Hindi) + `image` (real Wikimedia Commons photo URLs; `""` for Hauz Khas / Mehrauli Park which 404)
- [x] **Glassmorphism light theme** rewrite of `src/index.css` (frosted-glass panels, gradient hero, photo cards, animations)
- [x] **Discover** hero + search + tag chips + photo grid cards with UNESCO badges
- [x] **PlaceDetail** photo hero, geo-status banner, tabs (Overview / Ask the guide / Visitor info), streaming AI explanation
- [x] **AI chat** (`GuideChat.jsx`) — ask questions, streaming typewriter replies (en + hi)
- [x] **Floating audio player** (`AudioPlayer.jsx`) with progress bar + play/pause + wave animation
- [x] **Multi-language** EN / हिन्दी toggle (`i18n.js`, `t()` helper) — text + spoken TTS
- [x] **Guided Walk** (`GuidedWalk.jsx` + `tourService.js`) — animated 🚶 marker on a dashed route polyline; geofence entry triggers a spoken quick-fact; speed 1×/10×/50×/100×, pause/skip/reset, auto-voice toggle
- [x] **MapView** — route polyline, walking marker, photo popups, geofence circle, follow-the-walk pan
- [x] Deployed: **https://echoheritage-delhi-690.netlify.app** (verified 200)

## Where things live

```
C:\Users\DELL\heritage-guide\
├── src\App.jsx                    # view routing, walk engine, audio player, lang state
├── src\i18n.js                    # EN/HI strings + t(lang, key, vars)
├── src\components\
│   ├── Discover.jsx               # hero + photo grid
│   ├── PlaceDetail.jsx            # tabs + streaming AI + geo trigger
│   ├── GuideChat.jsx              # ask-the-guide chat
│   ├── GuidedWalk.jsx             # walk controller panel
│   ├── AudioPlayer.jsx            # floating player bar
│   └── MapView.jsx                # Leaflet map + route + walker
├── src\services\
│   ├── aiService.js               # AI layer (mock) — REAL LLM SWAP POINT
│   ├── ttsService.js              # SpeechSynthesis + progress
│   ├── geoService.js              # distance + geofence math
│   └── tourService.js             # route build + stepWalk engine
├── src\data\sites.json            # monument data (image + summaryHi added)
├── docs\MAP_ARCHITECTURE.md       # map tech decisions + upgrade path
└── README.md                      # pitch + roadmap
```

## Live / remote

- **Live demo:** https://echoheritage-delhi-690.netlify.app
- **Repo:** https://github.com/shanshantanusingh113-max/Echo-hertiage (branch `main`)
- Netlify account: `shantanusingh6362@gmail.com` / team `shantanusingh6362`
- **Redeploy:** `netlify deploy --prod --dir dist` (from the project folder)

## Key decisions already made (do NOT re-litigate)

1. **Map:** Leaflet + OSM now; MapLibre/Google + real GPS + native geofencing later. Documented in `MAP_ARCHITECTURE.md`.
2. **AI:** mock generator now; swap in Gemini free tier at the marked spot in `aiService.js` if a key appears.
3. **Audio:** browser SpeechSynthesis (free). Upgrade to neural TTS later.
4. **No API keys, no backend** — everything must keep working offline/static.
5. Old Netlify account (`shanshantanusingh113-max` netlify) has a broken credit flag — ignore it; use the `6362` account.
6. **Guided Walk constants:** `WALK_SPEED_MPS = 1.3`, `ARRIVE_RADIUS_M = 40`, geofence `GEOFENCE_RADIUS_M = 500`; default demo speed 65 m/s (~7 min for the full trail). Trail: Red Fort → Jama Masjid → Feroz Shah Kotla → Jantar Mantar → Safdarjung → Lodhi Gardens → Hauz Khas → Qutub Minar.

## Next steps (recommended order)

1. **Swap in a real LLM** (Gemini free tier) — follow the `// ---- REAL LLM SWAP POINT ----` comment in `aiService.js`.
2. **Add more monuments** or a second city by editing `sites.json` (schema documented at top of file).
3. **Real GPS toggle** — add a "Use my location" button calling `navigator.geolocation.watchPosition` (pattern in `MAP_ARCHITECTURE.md` §6.2).
4. **Deploy polish** — nicer site favicon/logo, maybe an onboarding screen.
5. **Hackathon pitch** — README already has a 90-second script; rehearse with team.

## ⚠️ Gotchas

- `sites.json` uses `lat`/`lng` (not `latitude`/`longitude`).
- `MapView.jsx` initialises the map in a `useEffect` guarded by `mapRef.current`; cleanup returns `map.remove()`.
- Geofence radius is `GEOFENCE_RADIUS_M = 500` in `geoService.js`.
- `stepWalk` loop was rewritten for correct carry-over across segments; keep `dtSeconds = 0.1` in the App engine interval.
- The walk fact trigger is guarded against stale hits (checks `walkRef.current.geofenceHit` after the async AI call).
- `--allow-anonymous`/Drop deploys create preview-only URLs; real deploys need `--prod` on the `6362` account.

---

## Resume prompt (copy-paste to continue)

> Continue work on the EchoHeritage hackathon prototype at `C:\Users\DELL\heritage-guide`.
> It is a React + Vite + Leaflet app ("audio-first AI heritage guide" for Delhi
> monuments). Read `docs/MAP_ARCHITECTURE.md`, `README.md`, and this file first.
> Current status: glassmorphism upgrade COMPLETE and deployed
> (https://echoheritage-delhi-690.netlify.app) — photos, floating audio player,
> streaming AI chat, EN/HI language toggle, and a Guided Walk simulation with a
> geofence-triggered spoken fact. The AI layer is a mock in `src/services/aiService.js`
> with a marked swap point for a real LLM. Pick the next task from "Next steps"
> (recommended: wire up a real Gemini free-tier key, then real-GPS mode). Do not
> change the tech stack or break offline/no-API-key mode. Verify with
> `npm run build` after changes.
