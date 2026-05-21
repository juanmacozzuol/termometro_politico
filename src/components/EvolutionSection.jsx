import { useState, useMemo } from 'react'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'
import { useSnapshots } from '../hooks/useSnapshots'
import { useAllSnapshots } from '../hooks/useAllSnapshots'

const PALETTE = [
  '#4f6ef7', '#f7a24f', '#4ade80', '#f87171',
  '#c084fc', '#facc15', '#38bdf8', '#fb923c', '#a3e635',
]

function fmt(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

function lastName(name) {
  return name.split(' ').at(-1)
}

// Merge flat rows [{pol_id, snap_date, pct}] into [{date, pol1: pct, pol2: pct, ...}]
function mergeRows(rows, politicians) {
  const byDate = {}
  for (const row of rows) {
    if (!byDate[row.snap_date]) byDate[row.snap_date] = { date: row.snap_date }
    byDate[row.snap_date][row.pol_id] = Number(row.pct)
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

function SingleChart({ polId }) {
  const { snapshots, loading } = useSnapshots(polId, 60)
  const data = snapshots.map(s => ({ date: s.snap_date, pct: Number(s.pct) }))

  if (loading) return <div style={s.placeholder} />
  if (data.length < 2) return <p style={s.empty}>No hay datos históricos aún. El gráfico se irá completando día a día.</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="singleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4f6ef7" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a28" />
        <XAxis dataKey="date" tickFormatter={fmt} tick={axTick} axisLine={axLine} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={axTick} axisLine={axLine} tickLine={false} width={38} />
        <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={{ color: '#4f6ef7' }}
          labelFormatter={fmt} formatter={v => [`${v}%`, 'Aprobación']} />
        <Area type="monotone" dataKey="pct" stroke="#4f6ef7" strokeWidth={2}
          fill="url(#singleGrad)" dot={false} activeDot={{ r: 4, fill: '#4f6ef7', strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function AllChart({ politicians }) {
  const { data: rows, loading } = useAllSnapshots(60)
  const data = useMemo(() => mergeRows(rows, politicians), [rows, politicians])

  if (loading) return <div style={s.placeholder} />
  if (data.length < 2) return <p style={s.empty}>No hay datos históricos aún. El gráfico se irá completando día a día.</p>

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a28" />
        <XAxis dataKey="date" tickFormatter={fmt} tick={axTick} axisLine={axLine} tickLine={false} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={axTick} axisLine={axLine} tickLine={false} width={38} />
        <Tooltip contentStyle={ttStyle} labelStyle={ttLabel}
          labelFormatter={fmt} formatter={(v, name) => [`${v}%`, name]} />
        <Legend
          wrapperStyle={{ fontSize: '0.72rem', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: '#888' }}>{value}</span>}
        />
        {politicians.map((pol, i) => (
          <Line
            key={pol.id}
            type="monotone"
            dataKey={pol.id}
            name={lastName(pol.name)}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function EvolutionSection({ politicians }) {
  const [selectedId, setSelectedId] = useState('all')

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.title}>Evolución de aprobación</span>
        <select style={s.select} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          <option value="all">Todos los políticos</option>
          {politicians.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {selectedId === 'all'
        ? <AllChart politicians={politicians} />
        : <SingleChart polId={selectedId} />
      }
    </div>
  )
}

const axTick = { fill: '#555', fontSize: 11 }
const axLine = { stroke: '#252535' }
const ttStyle = { background: '#13131e', border: '1px solid #252535', borderRadius: '6px', fontSize: '0.78rem' }
const ttLabel = { color: '#888' }

const s = {
  wrap: {
    background: '#13131e', border: '1px solid #222235',
    borderRadius: '12px', padding: '1.25rem',
  },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: '1rem',
  },
  title: {
    fontSize: '0.78rem', color: '#666',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  select: {
    background: '#0f0f18', border: '1px solid #252535',
    borderRadius: '6px', color: '#aaa',
    fontSize: '0.78rem', padding: '0.3rem 0.5rem', cursor: 'pointer',
  },
  placeholder: { height: 200, background: '#0f0f18', borderRadius: '8px' },
  empty: { fontSize: '0.8rem', color: '#444', textAlign: 'center', padding: '2rem 0' },
}
