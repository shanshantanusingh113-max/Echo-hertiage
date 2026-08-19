import { useState } from 'react'
import { nearestSite, formatDistance, distanceMeters } from '../services/geoService.js'

export default function SimBar({ sites, userLocation, onSimulate, onClear }) {
  const [target, setTarget] = useState(sites[0]?.id || '')
  const nearest = userLocation ? nearestSite(userLocation, sites) : null

  return (
    <div className="sim-bar">
      <div className="sim-inner">
        <div className="sim-title">
          <span className="sim-dot" /> SIMULATED GPS
          <span className="sim-sub">
            {userLocation ? (
              nearest ? `at ${nearest.site.name} (${formatDistance(nearest.dist)})` : 'in Delhi'
            ) : (
              'off — press a target to start'
            )}
          </span>
        </div>

        <div className="sim-controls">
          <select
            className="sim-select"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button className="btn primary small" onClick={() => {
            const site = sites.find((s) => s.id === target)
            if (site) onSimulate(site)
          }}>
            🎯 Simulate arrival
          </button>

          {userLocation && (
            <button className="btn ghost small" onClick={onClear}>Reset</button>
          )}
        </div>

        {nearest && (
          <div className="sim-nearest">
            Closest: <strong>{nearest.site.name}</strong> — {formatDistance(nearest.dist)}
          </div>
        )}
      </div>
    </div>
  )
}