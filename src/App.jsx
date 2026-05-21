import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import AuthModal from './components/AuthModal'

export default function App() {
  const { user, loading, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  if (loading) return <div style={styles.center}>Cargando...</div>

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Termómetro Político</h1>
        <div>
          {user ? (
            <div style={styles.userBar}>
              <span style={styles.email}>{user.email}</span>
              <button style={styles.btnSecondary} onClick={logout}>Salir</button>
            </div>
          ) : (
            <button style={styles.btnPrimary} onClick={() => setShowAuth(true)}>
              Ingresar para votar
            </button>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <p style={styles.placeholder}>
          {user
            ? `Bienvenido/a, ${user.email}. Los políticos aparecen acá en la Fase 3.`
            : 'Ingresá para poder votar a tus políticos.'}
        </p>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}

const styles = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 2rem', borderBottom: '1px solid #2e2e40',
    background: '#12121a',
  },
  logo: { fontSize: '1.25rem', fontWeight: 700, color: '#e8e8e8' },
  userBar: { display: 'flex', alignItems: 'center', gap: '1rem' },
  email: { color: '#999', fontSize: '0.875rem' },
  btnPrimary: {
    padding: '0.5rem 1.25rem', background: '#4f6ef7',
    border: 'none', borderRadius: '8px', color: '#fff',
    fontWeight: 600, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '0.5rem 1rem', background: 'none',
    border: '1px solid #2e2e40', borderRadius: '8px',
    color: '#999', cursor: 'pointer',
  },
  main: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  placeholder: { color: '#666', fontSize: '1rem' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#666' },
}
