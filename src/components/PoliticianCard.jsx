import { useState } from 'react'
import { useVotes } from '../hooks/useVotes'
import { useSnapshots } from '../hooks/useSnapshots'
import { CATEGORIES } from '../data/categories'
import ArcGauge from './ArcGauge'
import CategoryVote from './CategoryVote'
import NewsPanel from './NewsPanel'
import Sparkline from './Sparkline'

const SUB_CATEGORIES = CATEGORIES.filter(c => c.id !== 'general')

function Avatar({ name, photoUrl, size = 48 }) {
  const [imgError, setImgError] = useState(false)
  const initials = name
    .split(' ')
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, background: '#252535' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#252535', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.33,
      fontWeight: 700, color: '#777', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export default function PoliticianCard({ politician, user, province, onLoginRequest }) {
  const [expanded, setExpanded] = useState(false)
  const [showNews, setShowNews] = useState(false)
  const { loading, castVote, getAggregate, getUserVote, canVote } = useVotes(politician.id, user)
  const { snapshots } = useSnapshots(politician.id, 30)

  const general = getAggregate('general')
  const generalVote = getUserVote('general')
  const generalCooldown = canVote('general')
  const isApprove = generalVote?.vote === 'approve'
  const isReject = generalVote?.vote === 'reject'

  async function handleGeneralVote(type) {
    if (!user) { onLoginRequest(); return }
    if (!generalCooldown.can) return
    await castVote('general', type, province)
  }

  return (
    <div style={s.card}>
      <div style={s.top}>
        <div style={s.info}>
          <div style={s.nameRow}>
            <Avatar name={politician.name} photoUrl={politician.photo_url} size={44} />
            <div>
              <h2 style={s.name}>{politician.name}</h2>
              <span style={s.role}>{politician.role}</span>
              <span style={s.party}>{politician.party}</span>
            </div>
          </div>
        </div>

        <div style={s.gaugeWrap}>
          {loading ? <div style={s.gaugePlaceholder} /> : <ArcGauge value={general.pct} size={100} />}
          <span style={s.totalVotes}>
            {general.total > 0 ? `${Number(general.total).toLocaleString()} votos` : 'Sin votos'}
          </span>
          <Sparkline data={snapshots} width={72} height={20} />

          {user && !generalCooldown.can ? (
            <span style={s.cooldown}>↻ {generalCooldown.hoursLeft}h para cambiar</span>
          ) : (
            <div style={s.voteBtns}>
              <button
                style={{ ...s.vBtn, ...s.vUp, ...(isApprove ? s.vActiveUp : {}) }}
                onClick={() => handleGeneralVote('approve')}
                title="Aprobar"
              >▲ Aprobar</button>
              <button
                style={{ ...s.vBtn, ...s.vDown, ...(isReject ? s.vActiveDown : {}) }}
                onClick={() => handleGeneralVote('reject')}
                title="Rechazar"
              >▼ Rechazar</button>
            </div>
          )}
        </div>
      </div>

      <div style={s.btnRow}>
        <button style={s.expandBtn} onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Categorías ↑' : 'Categorías ↓'}
        </button>
        <button style={s.expandBtn} onClick={() => setShowNews(v => !v)}>
          {showNews ? 'Noticias ↑' : 'Noticias ↓'}
        </button>
      </div>

      {expanded && (
        <div style={s.body}>
          {SUB_CATEGORIES.map(cat => (
            <CategoryVote
              key={cat.id}
              category={cat}
              aggregate={getAggregate(cat.id)}
              userVote={getUserVote(cat.id)}
              cooldown={canVote(cat.id)}
              onVote={type => castVote(cat.id, type, province)}
              user={user}
              onLoginRequest={onLoginRequest}
            />
          ))}
        </div>
      )}

      {showNews && <NewsPanel politician={politician} />}
    </div>
  )
}

const s = {
  card: {
    background: '#13131e', border: '1px solid #222235',
    borderRadius: '12px', padding: '1.25rem',
    display: 'flex', flexDirection: 'column', gap: '0.75rem',
    height: '100%', boxSizing: 'border-box',
  },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  info: { flex: 1 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  name: { fontSize: '0.95rem', fontWeight: 700, color: '#e8e8e8', lineHeight: 1.3 },
  role: { fontSize: '0.75rem', color: '#888', display: 'block', marginTop: '1px' },
  party: {
    fontSize: '0.72rem', color: '#aaa', background: '#1e1e30',
    borderRadius: '4px', padding: '2px 7px',
    alignSelf: 'flex-start', marginTop: '2px',
  },
  gaugeWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: '0.3rem' },
  gaugePlaceholder: { width: 100, height: 46, background: '#1a1a28', borderRadius: '8px' },
  totalVotes: { fontSize: '0.68rem', color: '#555' },
  cooldown: { fontSize: '0.68rem', color: '#555' },
  voteBtns: { display: 'flex', gap: '0.25rem' },
  vBtn: {
    border: 'none', borderRadius: '5px', cursor: 'pointer',
    fontSize: '0.68rem', fontWeight: 700, padding: '0.25rem 0.5rem',
  },
  vUp: { background: '#14532d', color: '#4ade80' },
  vDown: { background: '#7f1d1d', color: '#f87171' },
  vActiveUp: { outline: '2px solid #4ade80' },
  vActiveDown: { outline: '2px solid #f87171' },
  btnRow: { display: 'flex', gap: '0.5rem' },
  expandBtn: {
    background: 'none', border: '1px solid #252535', borderRadius: '6px',
    color: '#666', fontSize: '0.78rem', cursor: 'pointer',
    padding: '0.35rem 0.75rem',
  },
  body: { display: 'flex', flexDirection: 'column' },
}
