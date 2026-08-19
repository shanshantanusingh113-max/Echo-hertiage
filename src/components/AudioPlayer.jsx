export default function AudioPlayer({ player, onToggle, onClose, t }) {
  if (!player) return null
  const pct = Math.round((player.progress || 0) * 100)

  return (
    <div className="audio-player glass">
      <div className="ap-art">
        <span className={player.speaking ? 'ap-wave on' : 'ap-wave'}>
          <i /><i /><i /><i />
        </span>
      </div>
      <div className="ap-main">
        <div className="ap-title">{player.title}</div>
        <div className="ap-bar">
          <div className="ap-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="ap-time">{pct}%</div>
      </div>
      <div className="ap-controls">
        <button className="ap-btn primary" onClick={onToggle} title={player.speaking ? 'Pause' : 'Play'}>
          {player.speaking ? '⏸' : '▶'}
        </button>
        <button className="ap-btn" onClick={onClose} title="Close">✕</button>
      </div>
    </div>
  )
}