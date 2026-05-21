import { useEffect } from 'react'
import { useNews } from '../hooks/useNews'

const SOURCE_LABELS = {
  infobae: 'Infobae',
  lanacion: 'La Nación',
  clarin: 'Clarín',
  perfil: 'Perfil',
  pagina12: 'Página 12',
}

export default function NewsPanel({ politician }) {
  const { articles, loading, error, fetched, fetch } = useNews(politician.name)

  useEffect(() => {
    if (!fetched) fetch()
  }, [fetched, fetch])

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.sectionTitle}>Noticias recientes</span>
        <button style={s.refreshBtn} onClick={fetch} disabled={loading} title="Actualizar">
          {loading ? '...' : '↻'}
        </button>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {loading && !fetched && (
        <p style={s.dim}>Buscando noticias...</p>
      )}

      {fetched && articles.length === 0 && !error && (
        <p style={s.dim}>No se encontraron noticias recientes.</p>
      )}

      {articles.map((article, i) => (
        <a
          key={i}
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="news-article"
          style={s.article}
        >
          <span style={s.source}>{SOURCE_LABELS[article.source] ?? article.source}</span>
          <span style={s.title}>{article.title}</span>
        </a>
      ))}

    </div>
  )
}

const s = {
  wrap: {
    borderTop: '1px solid #1a1a28',
    paddingTop: '0.75rem',
    marginTop: '0.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '0.25rem',
  },
  sectionTitle: { fontSize: '0.78rem', color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  refreshBtn: {
    background: 'none', border: 'none', color: '#555',
    cursor: 'pointer', fontSize: '0.9rem', padding: '0 4px',
  },
  dim: { fontSize: '0.78rem', color: '#444' },
  error: { fontSize: '0.75rem', color: '#f87171' },
  article: {
    display: 'flex', flexDirection: 'column', gap: '2px',
    padding: '0.5rem 0.6rem',
    background: '#0f0f18',
    border: '1px solid #1e1e2e',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'border-color 0.2s',
  },
  source: { fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' },
  title: { fontSize: '0.8rem', color: '#ccc', lineHeight: 1.4 },
}
