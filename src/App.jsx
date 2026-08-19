import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Discover from './components/Discover.jsx'
import MapView from './components/MapView.jsx'
import PlaceDetail from './components/PlaceDetail.jsx'
import GuidedWalk from './components/GuidedWalk.jsx'
import AudioPlayer from './components/AudioPlayer.jsx'
import sitesData from './data/sites.json'
import { isNear, distanceMeters, nearestSite, formatDistance, GEOFENCE_RADIUS_M } from './services/geoService.js'
import { buildRoute, stepWalk, distTo, DELHI_TRAIL } from './services/tourService.js'
import { speak, stopSpeaking } from './services/ttsService.js'
import { generateExplain } from './services/aiService.js'
import { t } from './i18n.js'

export default function App() {
  const [lang, setLang] = useState('en')
  const [view, setView] = useState('discover') // discover | map | detail | walk
  const [selected, setSelected] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  // ---- player ----
  const [player, setPlayer] = useState(null)
  const playerCtrl = useRef(null)

  const playAudio = useMemo(() => ({ title, text, lang: l, auto = true }) => {
    playerCtrl.current?.stop()
    setPlayer({ title, text, lang: l ?? lang, progress: 0, speaking: true })
    if (auto) {
      const ctrl = speak(text, {
        lang: l ?? lang,
        onProgress: (c, tot) => setPlayer((p) => (p ? { ...p, progress: tot ? c / tot : 0 } : p)),
      })
      playerCtrl.current = ctrl
      ctrl.done.then(() => setPlayer((p) => (p ? { ...p, speaking: false, progress: 1 } : p)))
    }
  }, [lang])

  const togglePlayer = () => {
    if (!player) return
    if (player.speaking) {
      playerCtrl.current?.stop()
      setPlayer((p) => ({ ...p, speaking: false }))
    } else {
      const ctrl = speak(player.text, {
        lang: player.lang,
        onProgress: (c, tot) => setPlayer((p) => (p ? { ...p, progress: tot ? c / tot : 0 } : p)),
      })
      playerCtrl.current = ctrl
      setPlayer((p) => ({ ...p, speaking: true, progress: 0 }))
      ctrl.done.then(() => setPlayer((p) => (p ? { ...p, speaking: false, progress: 1 } : p)))
    }
  }
  const closePlayer = () => { playerCtrl.current?.stop(); setPlayer(null) }

  useEffect(() => () => stopSpeaking(), [])

  // ---- walk ----
  const route = useMemo(() => buildRoute(sitesData, DELHI_TRAIL), [])
  const [walk, setWalk] = useState({
    running: false,
    speed: 65,
    segIndex: 0,
    segProgress: 0,
    pos: null,
    geofenceHit: null,
    explained: '',
    arrived: false,
    stopIndex: 0,
  })
  const walkRef = useRef(walk)
  walkRef.current = walk

  const activeSite = useMemo(() => {
    const p = walk.pos || userLocation
    if (p) return nearestSite(p, sitesData)
    return null
  }, [walk.pos, userLocation])

  const triggerWalkFact = useCallback(async (site) => {
    const full = await generateExplain(site, { mode: 'short', lang })
    if (walkRef.current.geofenceHit !== site.id) return // user moved on
    setWalk((w) => ({ ...w, explained: full }))
    if (walkRef.current.autoVoice) {
      playAudio({ title: `⚡ ${site.name}`, text: full, lang })
    }
  }, [lang, playAudio])

  const toggleAutoVoice = () => setWalk((w) => ({ ...w, autoVoice: !w.autoVoice }))

  function startWalk() {
    const first = route.stops[0]
    setWalk({
      running: true, speed: walk.speed, segIndex: 0, segProgress: 0,
      pos: { lat: first.lat, lng: first.lng },
      geofenceHit: null, explained: '', arrived: false, stopIndex: 0, autoVoice: walk.autoVoice,
    })
    setView('walk')
  }

  function skipNext() {
    const w = walkRef.current
    const nextIdx = Math.min(w.segIndex + 1, route.segments.length)
    const seg = route.segments[nextIdx]
    if (!seg) return
    setWalk((x) => ({
      ...x, segIndex: nextIdx, segProgress: 0,
      pos: { lat: seg.from.lat, lng: seg.from.lng },
      geofenceHit: null, explained: '', stopIndex: Math.min(x.stopIndex + 1, route.stops.length),
    }))
  }

  function resetWalk() {
    setWalk((w) => ({ ...w, running: false, segIndex: 0, segProgress: 0, pos: null, geofenceHit: null, explained: '', arrived: false, stopIndex: 0 }))
  }

  // walk engine
  useEffect(() => {
    if (!walk.running) return
    const id = setInterval(() => {
      const w = walkRef.current
      const step = stepWalk(route, { segIndex: w.segIndex, segProgress: w.segProgress }, 0.1, w.speed)
      const next = {
        ...w,
        segIndex: step.state.segIndex,
        segProgress: step.state.segProgress,
        pos: step.pos,
        arrived: step.arrived,
      }
      const dest = step.currentStop
      if (dest && !step.arrived) {
        const d = distTo(step.pos, dest)
        if (d <= GEOFENCE_RADIUS_M && w.geofenceHit !== dest.id) {
          next.geofenceHit = dest.id
          next.stopIndex = Math.min(w.stopIndex + 1, route.stops.length)
          triggerWalkFact(dest)
        }
      }
      if (step.arrived) {
        next.stopIndex = Math.min(w.stopIndex + 1, route.stops.length)
        next.running = false
        clearInterval(id)
      }
      setWalk(next)
    }, 100)
    return () => clearInterval(id)
  }, [walk.running, route, triggerWalkFact])

  // ---- navigation ----
  const openSite = (site) => { setSelected(site); setView('detail') }
  const openMap = (site) => { if (site) setSelected(site); setView('map') }
  const teleport = (site) => {
    setUserLocation({ lat: site.lat + 0.002, lng: site.lng + 0.002 })
    setSelected(null)
    setView('map')
  }

  const nearSite = userLocation && !walk.pos ? sitesData.find((s) => isNear(userLocation, s)) || null : null
  const panelSite = selected || nearSite || activeSite?.site || null
  const panelDist = panelSite && userLocation && !walk.pos
    ? distanceMeters(userLocation.lat, userLocation.lng, panelSite.lat, panelSite.lng)
    : null

  const walkPos = walk.pos

  return (
    <div className="app">
      <header className="app-header glass">
        <div className="brand" onClick={() => { setView('discover'); setSelected(null) }}>
          <span className="brand-mark">🔊</span>
          <span className="brand-name">{t(lang, 'brand')}</span>
          <span className="brand-tag">{t(lang, 'tagline')}</span>
        </div>
        <nav className="nav">
          <button className={view === 'discover' ? 'nav-btn active' : 'nav-btn'} onClick={() => { setView('discover'); setSelected(null) }}>{t(lang, 'navDiscover')}</button>
          <button className={view === 'map' ? 'nav-btn active' : 'nav-btn'} onClick={() => { setView('map'); setSelected(selected) }}>{t(lang, 'navMap')}</button>
          <button className={view === 'walk' ? 'nav-btn active' : 'nav-btn'} onClick={walk.running ? () => {} : startWalk}>{t(lang, 'navWalk')}</button>
        </nav>
        <div className="lang-switch">
          <button className={lang === 'en' ? 'lang-btn active' : 'lang-btn'} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'hi' ? 'lang-btn active' : 'lang-btn'} onClick={() => setLang('hi')}>हिं</button>
        </div>
      </header>

      <main className="app-main">
        {view === 'discover' && <Discover sites={sitesData} onOpen={openSite} t={(k, v) => t(lang, k, v)} lang={lang} />}

        {view === 'map' && (
          <div className="map-layout">
            <div className="map-wrap">
              <MapView
                sites={sitesData}
                userLocation={userLocation}
                activeSite={panelSite}
                onSelectSite={setSelected}
                walkPos={walkPos}
                route={route}
                t={(k, v) => t(lang, k, v)}
                lang={lang}
              />
            </div>
            <aside className="side-panel">
              <div className="panel-card glass">
                <h3>🗺️ {t(lang, 'navMap')}</h3>
                <p className="muted">
                  {walk.pos
                    ? `🚶 ${t(lang, 'currentLoc')}`
                    : userLocation
                      ? activeSite ? `📍 ${formatDistance(activeSite.dist)} — ${activeSite.site.name}` : '📍 Delhi'
                      : t(lang, 'noLocation')}
                </p>
                {nearSite && !walk.pos && (
                  <button className="btn primary" onClick={() => openSite(nearSite)}>⚡ {t(lang, 'triggerCardTitle')} — {nearSite.name}</button>
                )}
              </div>

              {panelSite && (
                <div className="panel-card glass site-mini" onClick={() => openSite(panelSite)}>
                  <div className="site-photo sm">
                    {panelSite.image && <img src={panelSite.image} alt={panelSite.name} onError={(e) => { e.currentTarget.style.display = 'none' }} />}
                    <span className="site-initial">{panelSite.name.charAt(0)}</span>
                    {panelSite.unesco && <span className="badge">UNESCO</span>}
                  </div>
                  <div className="site-mini-body">
                    <h4>{panelSite.name}</h4>
                    <span className="muted">{panelSite.era} · {panelSite.builtYear}</span>
                  </div>
                </div>
              )}

              <div className="panel-card glass">
                <h4>{t(lang, 'teleportLabel')}</h4>
                <select className="sim-select" onChange={(e) => { const s = sitesData.find((x) => x.id === e.target.value); if (s) teleport(s) }} defaultValue="">
                  <option value="" disabled>{t(lang, 'teleportLabel')}…</option>
                  {sitesData.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {panelDist != null && (
                <div className="panel-card glass">
                  <h4>{t(lang, 'currentLoc')}</h4>
                  <p className="muted">{panelSite.name}: {formatDistance(panelDist)}</p>
                </div>
              )}
            </aside>
          </div>
        )}

        {view === 'walk' && (
          <div className="walk-layout">
            <div className="map-wrap">
              <MapView
                sites={sitesData}
                userLocation={null}
                activeSite={activeSite?.site || null}
                onSelectSite={setSelected}
                walkPos={walkPos}
                route={route}
                t={(k, v) => t(lang, k, v)}
                lang={lang}
              />
            </div>
            <aside className="side-panel">
              <GuidedWalk
                running={walk.running}
                speed={walk.speed}
                setSpeed={(s) => setWalk((w) => ({ ...w, speed: s }))}
                onToggle={() => setWalk((w) => ({ ...w, running: !w.running }))}
                onSkip={skipNext}
                onReset={resetWalk}
                stopIndex={walk.stopIndex}
                totalStops={route.stops.length}
                geofenceHit={walk.geofenceHit ? sitesData.find((s) => s.id === walk.geofenceHit) : null}
                explained={walk.explained}
                arrived={walk.arrived}
                nextStop={walk.pos ? route.segments[walk.segIndex]?.to ?? null : null}
                distNext={walk.pos && route.segments[walk.segIndex] ? distTo(walk.pos, route.segments[walk.segIndex].to) : null}
                autoVoice={!!walk.autoVoice}
                toggleAutoVoice={toggleAutoVoice}
                site={walk.pos ? activeSite?.site : null}
                lang={lang}
                t={(k, v) => t(lang, k, v)}
              />
              {!walk.running && !walk.arrived && (
                <div className="panel-card glass">
                  <button className="btn primary wide" onClick={startWalk}>▶ {t(lang, 'walkStart')}</button>
                </div>
              )}
            </aside>
          </div>
        )}

        {view === 'detail' && panelSite && (
          <PlaceDetail
            site={panelSite}
            isNear={!!nearSite && nearSite.id === panelSite.id}
            distance={panelDist}
            onBack={() => setView('discover')}
            onOpenMap={(s) => openMap(s)}
            onPlay={playAudio}
            t={(k, v) => t(lang, k, v)}
            lang={lang}
          />
        )}
      </main>

      <AudioPlayer player={player} onToggle={togglePlayer} onClose={closePlayer} t={(k, v) => t(lang, k, v)} />

      <footer className="app-footer">{t(lang, 'footerNote')}</footer>
    </div>
  )
}