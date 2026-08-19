import { formatDistance, GEOFENCE_RADIUS_M } from '../services/geoService.js'

export default function GuidedWalk({
  running,
  speed,
  setSpeed,
  onToggle,
  onSkip,
  onReset,
  stopIndex,
  totalStops,
  geofenceHit,
  explained,
  arrived,
  nextStop,
  distNext,
  autoVoice,
  toggleAutoVoice,
  site,
  lang,
  t,
}) {
  return (
    <div className="walk-panel glass">
      <div className="walk-head">
        <h3>{t('walkTitle')}</h3>
        <p className="muted">{t('walkSubtitle')}</p>
      </div>

      <div className="walk-status">
        <div className="walk-progress">
          <div className="walk-progress-fill" style={{ width: `${(Math.min(stopIndex, totalStops) / totalStops) * 100}%` }} />
        </div>
        <div className="walk-progress-label">{t('walkProgress', { cur: Math.min(stopIndex + 1, totalStops), total: totalStops })}</div>
      </div>

      {arrived && (
        <div className="walk-arrived">
          <strong>🏁 {t('walkDone', { n: stopIndex })}</strong>
        </div>
      )}

      {geofenceHit && !arrived && (
        <div className="walk-geofence-hit">
          <span className="pulse-dot" />
          <strong>{t('walkGeofence', { name: geofenceHit.name })}</strong>
          {explained && <div className="walk-explained">{explained}</div>}
        </div>
      )}

      {!geofenceHit && !arrived && nextStop && (
        <div className="walk-next">
          <div className="walk-next-label">{t('walkWalkingTo', { name: nextStop.name })}</div>
          <div className="walk-next-dist">{formatDistance(distNext)}</div>
        </div>
      )}

      <div className="walk-controls">
        <button className="btn primary" onClick={onToggle}>{running ? t('walkPause') : t('walkResume')}</button>
        <button className="btn outline" onClick={onSkip}>{t('walkNext')} ›</button>
        <button className="btn ghost" onClick={onReset}>{t('walkReset')}</button>
      </div>

      <div className="walk-options">
        <label className="switch-row">
          <span>{t('walkAutoVoice')}</span>
          <button className={`switch ${autoVoice ? 'on' : ''}`} onClick={toggleAutoVoice}>
            <i />
          </button>
        </label>
        <label className="speed-control">
          {t('walkSpeed')}
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
            <option value={2}>1×</option>
            <option value={13}>10×</option>
            <option value={65}>50×</option>
            <option value={130}>100×</option>
          </select>
        </label>
      </div>

      <div className="walk-legend muted">
        {site ? `📍 ${t('currentLoc')}: ${site.name}` : t('noLocation')} · ⭕ {GEOFENCE_RADIUS_M} m geofence
      </div>
    </div>
  )
}