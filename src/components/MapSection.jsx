import { useState } from 'react'
import ArgentinaMap from './ArgentinaMap'

export default function MapSection({ politicians }) {
  const [selectedId, setSelectedId] = useState(politicians[0]?.id || '')

  const selected = politicians.find(p => p.id === selectedId)

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h2 style={s.title}>Distribución por provincia</h2>
        <select
          style={s.select}
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          {politicians.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={s.body}>
        <ArgentinaMap polId={selectedId} />

        <div style={s.legend}>
          <p style={s.legendTitle}>
            {selected?.name}
          </p>
          <p style={s.legendSub}>Aprobación por provincia</p>
          <div style={s.gradient} />
          <div style={s.gradientLabels}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <div style={{ ...s.dot, background: '#1e1e2e', marginTop: '1rem' }}>
            <span style={s.dotLabel}>Sin datos</span>
          </div>
          <p style={s.note}>
            Los datos se acumulan a medida que los usuarios votan e indican su provincia.
          </p>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    marginTop: '2.5rem',
    padding: '1.5rem',
    background: '#13131e',
    border: '1px solid #222235',
    borderRadius: '12px',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
  },
  title: { fontSize: '1rem', fontWeight: 700, color: '#e8e8e8' },
  select: {
    background: '#0f0f13', border: '1px solid #252535',
    borderRadius: '7px', color: '#ccc',
    fontSize: '0.85rem', padding: '0.4rem 0.75rem', cursor: 'pointer',
  },
  body: { display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' },
  legend: { flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  legendTitle: { fontSize: '0.9rem', fontWeight: 600, color: '#ccc' },
  legendSub: { fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' },
  gradient: {
    height: '12px', borderRadius: '6px',
    background: 'linear-gradient(to right, hsl(0,65%,35%), hsl(60,65%,35%), hsl(120,65%,35%))',
  },
  gradientLabels: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.7rem', color: '#666',
  },
  dot: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    width: '14px', height: '14px', borderRadius: '3px',
    border: '1px solid #2e2e40',
  },
  dotLabel: { fontSize: '0.72rem', color: '#555', marginLeft: '18px' },
  note: { fontSize: '0.72rem', color: '#444', marginTop: '0.75rem', lineHeight: 1.5 },
}
