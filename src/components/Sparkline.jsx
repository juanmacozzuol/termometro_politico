export default function Sparkline({ data, width = 72, height = 22 }) {
  if (!data || data.length < 2) return null

  const values = data.map(d => Number(d.pct))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const trend = values[values.length - 1] - values[0]
  const color = trend > 1 ? '#4ade80' : trend < -1 ? '#f87171' : '#555'

  return (
    <svg width={width} height={height} style={{ display: 'block', flexShrink: 0 }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.75}
      />
    </svg>
  )
}
