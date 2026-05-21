import { useState } from 'react'
import { useProvinceVotes } from '../hooks/useProvinceVotes'

// Coordenadas aproximadas: x = (lon+74)*13.5, y = (-21-lat)*13.5
// ViewBox 0 0 310 490
const PROVINCE_PATHS = [
  { id: 'Jujuy',                d: 'M122,14 L122,47 L74,47 L74,28 L81,14 Z' },
  { id: 'Salta',                d: 'M162,14 L162,74 L74,74 L74,47 L122,47 L122,14 Z' },
  { id: 'Formosa',              d: 'M223,14 L223,68 L162,68 L162,14 Z' },
  { id: 'Tucumán',              d: 'M108,74 L108,108 L81,108 L81,74 Z' },
  { id: 'Catamarca',            d: 'M81,54 L81,148 L47,148 L47,54 Z' },
  { id: 'Santiago del Estero',  d: 'M162,61 L162,141 L108,141 L108,61 Z' },
  { id: 'Chaco',                d: 'M216,68 L216,122 L149,122 L149,68 Z' },
  { id: 'Misiones',             d: 'M277,54 L270,101 L243,101 L236,74 L243,54 Z' },
  { id: 'Corrientes',           d: 'M236,81 L236,148 L196,148 L196,81 Z' },
  { id: 'Entre Ríos',          d: 'M230,135 L230,189 L189,189 L189,135 Z' },
  { id: 'Santa Fe',             d: 'M196,101 L196,189 L162,189 L162,101 Z' },
  { id: 'Córdoba',             d: 'M162,122 L162,203 L108,203 L108,122 Z' },
  { id: 'La Rioja',             d: 'M108,108 L108,189 L54,189 L54,108 Z' },
  { id: 'San Juan',             d: 'M81,101 L81,162 L34,162 L34,101 Z' },
  { id: 'Mendoza',              d: 'M74,162 L74,236 L27,236 L27,162 Z' },
  { id: 'San Luis',             d: 'M122,162 L122,210 L74,210 L74,162 Z' },
  { id: 'La Pampa',             d: 'M162,196 L162,257 L81,257 L81,210 L122,210 L122,196 Z' },
  { id: 'Buenos Aires',         d: 'M230,176 L243,277 L162,284 L149,250 L149,176 Z' },
  { id: 'CABA',                 d: 'M208,182 L218,182 L218,192 L208,192 Z' },
  { id: 'Neuquén',             d: 'M81,210 L81,270 L27,270 L27,236 L54,210 Z' },
  { id: 'Río Negro',           d: 'M162,243 L162,284 L27,284 L27,270 L81,270 L81,257 L162,257 Z' },
  { id: 'Chubut',               d: 'M162,284 L162,358 L20,358 L20,284 Z' },
  { id: 'Santa Cruz',           d: 'M149,344 L149,426 L7,426 L7,344 Z' },
  { id: 'Tierra del Fuego',     d: 'M135,419 L128,460 L7,460 L7,419 Z' },
]

function getColor(pct) {
  if (pct === null) return '#1e1e2e'
  return `hsl(${pct * 1.2}, 65%, 35%)`
}

export default function ArgentinaMap({ polId }) {
  const provinceData = useProvinceVotes(polId)
  const [tooltip, setTooltip] = useState(null)

  function handleEnter(e, id) {
    const d = provinceData[id]
    setTooltip({ x: e.clientX, y: e.clientY, id, d })
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg
        viewBox="0 0 310 490"
        width={240}
        height={380}
        style={{ display: 'block' }}
      >
        {PROVINCE_PATHS.map(({ id, d }) => {
          const pd = provinceData[id]
          const pct = pd?.pct ?? null
          return (
            <path
              key={id}
              d={d}
              fill={getColor(pct)}
              stroke="#0a0a12"
              strokeWidth="1.5"
              strokeLinejoin="round"
              onMouseEnter={e => handleEnter(e, id)}
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer', transition: 'fill 0.3s' }}
            />
          )
        })}
      </svg>

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 14,
          top: tooltip.y - 10,
          background: '#1a1a28',
          border: '1px solid #2e2e40',
          borderRadius: '7px',
          padding: '0.5rem 0.75rem',
          pointerEvents: 'none',
          zIndex: 200,
          minWidth: '130px',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e8e8e8', marginBottom: '2px' }}>
            {tooltip.id}
          </div>
          {tooltip.d ? (
            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
              <span style={{ color: `hsl(${tooltip.d.pct * 1.2}, 65%, 55%)`, fontWeight: 700 }}>
                {tooltip.d.pct}%
              </span>
              {' '}aprobación · {tooltip.d.total} votos
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#555' }}>Sin datos aún</div>
          )}
        </div>
      )}
    </div>
  )
}
