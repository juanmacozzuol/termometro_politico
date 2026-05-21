import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import AuthModal from './components/AuthModal'
import PoliticianCard from './components/PoliticianCard'
import ProposalSection from './components/ProposalSection'
import MapSection from './components/MapSection'
import BoletinSidebar from './components/BoletinSidebar'
import EvolutionSection from './components/EvolutionSection'
import { PROVINCES } from './data/provinces'
import { usePoliticians } from './hooks/usePoliticians'

export default function App() {
  const { user, loading, logout } = useAuth()
  const { politicians, loading: loadingPols } = usePoliticians()
  const [showAuth, setShowAuth] = useState(false)
  const [province, setProvince] = useState('')

  if (loading || loadingPols) return <div style={s.center}>Cargando...</div>

  return (
    <div style={s.app}>
      <header style={s.header}>
        <h1 style={s.logo}>Termómetro Político 🇦🇷</h1>
        {user ? (
          <div className="app-header-user" style={s.userBar}>
            <select
              className="app-prov-select"
              style={s.provSelect}
              value={province}
              onChange={e => setProvince(e.target.value)}
              title="Tu provincia"
            >
              <option value="">Provincia (opcional)</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="app-email" style={s.email}>{user.email}</span>
            <button style={s.btnSecondary} onClick={logout}>Salir</button>
          </div>
        ) : (
          <button style={s.btnPrimary} onClick={() => setShowAuth(true)}>
            Ingresar para votar
          </button>
        )}
      </header>

      <main className="app-main" style={s.main}>
        {!user && (
          <div style={s.banner}>
            Evaluá a los políticos argentinos por categoría.{' '}
            <button style={s.bannerLink} onClick={() => setShowAuth(true)}>
              Ingresá para votar →
            </button>
          </div>
        )}
        <div className="app-columns" style={s.columns}>
          <div style={s.content}>
            <div style={s.grid}>
              {politicians.map(pol => (
                <PoliticianCard
                  key={pol.id}
                  politician={pol}
                  user={user}
                  province={province}
                  onLoginRequest={() => setShowAuth(true)}
                />
              ))}
            </div>
            {politicians.length > 0 && <EvolutionSection politicians={politicians} />}
            {politicians.length > 0 && <MapSection politicians={politicians} />}
            <ProposalSection user={user} onLoginRequest={() => setShowAuth(true)} />
          </div>
          <BoletinSidebar />
        </div>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}

const s = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 2rem', borderBottom: '1px solid #1e1e2e',
    background: '#0d0d14', position: 'sticky', top: 0, zIndex: 10,
  },
  logo: { fontSize: '1.1rem', fontWeight: 700, color: '#e8e8e8' },
  userBar: { display: 'flex', alignItems: 'center', gap: '1rem' },
  email: { fontSize: '0.8rem', color: '#666' },
  btnPrimary: {
    padding: '0.45rem 1.1rem', background: '#3b5bdb',
    border: 'none', borderRadius: '7px', color: '#fff',
    fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
  },
  btnSecondary: {
    padding: '0.4rem 0.9rem', background: 'none',
    border: '1px solid #252535', borderRadius: '7px',
    color: '#888', cursor: 'pointer', fontSize: '0.8rem',
  },
  main: { flex: 1, padding: '1.5rem 2rem', maxWidth: '1380px', margin: '0 auto', width: '100%' },
  columns: { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' },
  content: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' },
  banner: {
    background: '#13131e', border: '1px solid #222235',
    borderRadius: '8px', padding: '0.75rem 1rem',
    fontSize: '0.875rem', color: '#888', marginBottom: '1.5rem',
  },
  bannerLink: {
    background: 'none', border: 'none', color: '#4f6ef7',
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
  },
  provSelect: {
    background: '#0f0f13', border: '1px solid #252535',
    borderRadius: '6px', color: '#888',
    fontSize: '0.78rem', padding: '0.3rem 0.5rem', cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  center: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#555',
  },
}
