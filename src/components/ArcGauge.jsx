export default function ArcGauge({ value = 0, size = 110 }) {
  const r = 38
  const cx = 50
  const cy = 54
  const circ = 2 * Math.PI * r
  const half = circ / 2
  const filled = (Math.min(Math.max(value, 0), 100) / 100) * half
  const color = value === 0 ? '#333' : `hsl(${value * 1.2}, 72%, 50%)`

  return (
    <svg viewBox="0 12 100 46" width={size} height={size * 0.46}>
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke="#252535" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${half} ${circ}`}
        transform={`rotate(180, ${cx}, ${cy})`}
      />
      {value > 0 && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          transform={`rotate(180, ${cx}, ${cy})`}
        />
      )}
      <text
        x={cx} y={cy + 2}
        textAnchor="middle"
        fill={value === 0 ? '#444' : '#e8e8e8'}
        fontSize="15" fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {value === 0 ? '—' : `${value}%`}
      </text>
    </svg>
  )
}
