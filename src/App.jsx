import { useMemo, useState } from 'react'
import Discover from './components/Discover.jsx'
import MapView from './components/MapView.jsx'
import PlaceDetail from './components/PlaceDetail.jsx'
import SimBar from './components/SimBar.jsx'
import sitesData from './data/sites.json'
import { isNear, distanceMeters } from './services/geoService.js'

export default function App() {
  const [view, setView] = useState('discover') // 'discover' | 'map' | 'detail'
  const [selected, setSelected] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  const activeSite = useMemo(() => {
    if (userLocation) {
      let best = null
      let bestDist = Infinity
      for (const s of sitesData) {
        const d = distanceMeters(userLocation.lat, userLocation.lng, s.lat, s.lng)
        if (d < bestDist) {
          bestDist = d
          best = s
        }
      }
      return { site: best, dist: bestDist }
    }
    return null
  }, [userLocation])

  const nearSite = useMemo(
    () => (userLocation ? sitesData.find((s) => isNear(userLocation, s)) || null : null),
    [userLocation]
  )

  const selectedSite = selected || nearSite || null

  function openSite(site) {
    setSelected(site)
    setView('detail')
  }

  function openMap(site) {
    if (site) setSelected(site)
    setView('map')
  }

  function simulate(site) {
    setUserLocation({ lat: site.lat + 0.002, lng: site.lng + 0.002 })
    setSelected(null)
    setView('map')
  }

  function clearSim() {
    setUserLocation(null)
    setSelected(null)
    setView('discover')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand" onClick={() => { setView('discover'); setSelected(null) }}>
          <span className="brand-mark">🔊</span>
          <span className="brand-name">EchoHeritage</span>
          <span className="brand-tag">Delhi · Audio Heritage Guide</span>
        </div>
        <nav className="nav">
          <button className={view === 'discover' ? 'nav-btn active' : 'nav-btn'} onClick={() => { setView('discover'); setSelected(null) }}>
            Discover
          </button>
          <button className={view === 'map' ? 'nav-btn active' : 'nav-btn'} onClick={() => { setView('map'); setSelected(selected) }}>
            Map
          </button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'discover' && <Discover sites={sitesData} onOpen={openSite} />}

        {view === 'map' && (
          <div className="map-wrap">
            <MapView
              sites={sitesData}
              userLocation={userLocation}
              activeSite={activeSite?.site || null}
              onSelectSite={(site) => setSelected(site)}
            />
            <div className="map-overlay">
              <h3>📍 Map View</h3>
              <p className="muted">
                {userLocation
                  ? activeSite
                    ? `Simulated position is ${Math.round(activeSite.dist)}m from ${activeSite.site.name}.`
                    : 'Simulated position is outside the city.'
                  : 'Pick a target below and press "Simulate arrival" to trigger the geo-fence demo.'}
              </p>
              {nearSite && (
                <button className="btn primary" onClick={() => openSite(nearSite)}>
                  ⚡ Trigger fact — {nearSite.name}
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'detail' && selectedSite && (
          <PlaceDetail
            site={selectedSite}
            isNear={!!nearSite && nearSite.id === selectedSite.id}
            distance={userLocation ? distanceMeters(userLocation.lat, userLocation.lng, selectedSite.lat, selectedSite.lng) : null}
            onBack={() => setView('discover')}
            onOpenMap={(s) => openMap(s)}
          />
        )}
      </main>

      <SimBar
        sites={sitesData}
        userLocation={userLocation}
        onSimulate={simulate}
        onClear={clearSim}
      />

      <footer className="app-footer">
        Prototype for hackathon demo · Data curated from ASI / public heritage sources · Built with React + Leaflet
      </footer>
    </div>
  )
}