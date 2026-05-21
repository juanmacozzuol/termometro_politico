import { useEffect, useState } from 'react'
import { useBoletin } from '../hooks/useBoletin'

export default function BoletinSidebar() {
  const { items, loading, error, fetched, search, handleSearch } = useBoletin()
  const [input, setInput] = useState('')

  useEffect(() => {
    if (!fetched) search('')
  }, [fetched, search])

  function onSubmit(e) {
    e.preventDefault()
    handleSearch(input.trim())
  }

  return (
    <aside className="boletin-aside" style={s.aside}>
      <div style={s.header}>
        <span style={s.title}>Boletín Oficial</span>
        <a
          href="https://www.boletinoficial.gob.ar"
          target="_blank"
          rel="noopener noreferrer"
          style={s.link}
        >
          boletinoficial.gob.ar ↗
        </a>
      </div>

      <form onSubmit={onSubmit} style={s.form}>
        <input
          style={s.input}
          type="text"
          placeholder="Buscar en el Boletín..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit" style={s.searchBtn} disabled={loading}>
          {loading ? '...' : '↵'}
        </button>
      </form>

      {error && <p style={s.error}>{error}</p>}

      {loading && !fetched && (
        <p style={s.dim}>Cargando publicaciones...</p>
      )}

      {fetched && items.length === 0 && !error && (
        <a
          href="https://www.boletinoficial.gob.ar/busquedaAvanzada/index"
          target="_blank"
          rel="noopener noreferrer"
          style={s.fallbackLink}
        >
          Ver publicaciones en el Boletín Oficial →
        </a>
      )}

      <div style={s.list}>
        {items.map((item, i) => (
          <a
            key={item.id ?? i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="boletin-item"
            style={s.item}
          >
            <div style={s.itemMeta}>
              <span style={s.seccion}>{item.seccion}</span>
              {item.fecha && <span style={s.fecha}>{item.fecha}</span>}
            </div>
            <span style={s.titulo}>{item.titulo}</span>
            {item.dependencia && (
              <span style={s.dependencia}>{item.dependencia}</span>
            )}
          </a>
        ))}
      </div>
    </aside>
  )
}

const s = {
  aside: {
    width: '270px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    position: 'sticky',
    top: '72px',
    maxHeight: 'calc(100vh - 90px)',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
    marginBottom: '0.1rem',
  },
  title: {
    fontSize: '0.72rem',
    color: '#666',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  link: {
    fontSize: '0.65rem',
    color: '#4f6ef7',
    textDecoration: 'none',
  },
  form: {
    display: 'flex',
    gap: '0.3rem',
  },
  input: {
    flex: 1,
    background: '#0f0f18',
    border: '1px solid #252535',
    borderRadius: '6px',
    color: '#ccc',
    fontSize: '0.75rem',
    padding: '0.35rem 0.6rem',
    outline: 'none',
  },
  searchBtn: {
    background: '#1e1e30',
    border: '1px solid #252535',
    borderRadius: '6px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0.35rem 0.6rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0.5rem 0.6rem',
    background: '#0f0f18',
    border: '1px solid #1e1e2e',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'border-color 0.2s',
  },
  itemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seccion: {
    fontSize: '0.62rem',
    color: '#4f6ef7',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  fecha: {
    fontSize: '0.62rem',
    color: '#444',
  },
  titulo: {
    fontSize: '0.78rem',
    color: '#ccc',
    lineHeight: 1.35,
  },
  dependencia: {
    fontSize: '0.65rem',
    color: '#555',
  },
  dim: { fontSize: '0.78rem', color: '#444' },
  error: { fontSize: '0.75rem', color: '#f87171' },
  fallbackLink: {
    fontSize: '0.78rem', color: '#4f6ef7',
    textDecoration: 'none', padding: '0.5rem 0',
    display: 'block',
  },
}
