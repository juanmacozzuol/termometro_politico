import { useState } from 'react'

export default function CategoryVote({ category, aggregate, userVote, cooldown, onVote, user, onLoginRequest }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleVote(type) {
    if (!user) { onLoginRequest(); return }
    if (!cooldown.can) return
    setPending(true)
    setError('')
    try {
      await onVote(type)
    } catch (e) {
      setError(e.message)
    } finally {
      setPending(false)
    }
  }

  const pct = aggregate.pct
  const isApprove = userVote?.vote === 'approve'
  const isReject = userVote?.vote === 'reject'
  const barColor = pct > 0 ? `hsl(${pct * 1.2}, 65%, 45%)` : '#333'

  return (
    <div style={s.row}>
      <div style={s.left}>
        <span style={s.icon}>{category.icon}</span>
        <div>
          <span style={s.label}>{category.label}</span>
          {userVote && (
            <span style={{ ...s.badge, color: isApprove ? '#4ade80' : '#f87171' }}>
              {isApprove ? '✓ Aprobaste' : '✗ Rechazaste'}
            </span>
          )}
        </div>
      </div>

      <div style={s.right}>
        <div style={s.barWrap}>
          <div style={{ ...s.bar, width: `${pct}%`, background: barColor }} />
        </div>
        <span style={s.pct}>{aggregate.total > 0 ? `${pct}%` : '—'}</span>

        {user && !cooldown.can ? (
          <span style={s.cooldown}>↻ {cooldown.hoursLeft}h</span>
        ) : (
          <div style={s.btns}>
            <button
              style={{ ...s.btn, ...s.up, ...(isApprove ? s.activeUp : {}) }}
              onClick={() => handleVote('approve')}
              disabled={pending}
              title="Aprobar"
            >▲</button>
            <button
              style={{ ...s.btn, ...s.down, ...(isReject ? s.activeDown : {}) }}
              onClick={() => handleVote('reject')}
              disabled={pending}
              title="Rechazar"
            >▼</button>
          </div>
        )}
      </div>

      {error && <p style={s.err}>{error}</p>}
    </div>
  )
}

const s = {
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.55rem 0', borderBottom: '1px solid #1a1a28',
    flexWrap: 'wrap', gap: '0.4rem',
  },
  left: { display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '150px' },
  icon: { fontSize: '1rem', width: '1.4rem', textAlign: 'center', flexShrink: 0 },
  label: { fontSize: '0.83rem', color: '#ccc', display: 'block' },
  badge: { fontSize: '0.68rem', display: 'block', marginTop: '1px' },
  right: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  barWrap: { width: '70px', height: '5px', background: '#222230', borderRadius: '3px', overflow: 'hidden' },
  bar: { height: '100%', borderRadius: '3px', transition: 'width 0.4s ease' },
  pct: { fontSize: '0.78rem', color: '#888', width: '30px', textAlign: 'right' },
  btns: { display: 'flex', gap: '0.2rem' },
  btn: {
    width: '26px', height: '26px', border: 'none', borderRadius: '5px',
    cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  up: { background: '#14532d', color: '#4ade80' },
  down: { background: '#7f1d1d', color: '#f87171' },
  activeUp: { outline: '2px solid #4ade80' },
  activeDown: { outline: '2px solid #f87171' },
  cooldown: { fontSize: '0.72rem', color: '#555', width: '56px', textAlign: 'center' },
  err: { width: '100%', fontSize: '0.72rem', color: '#f87171', marginTop: '2px' },
}
