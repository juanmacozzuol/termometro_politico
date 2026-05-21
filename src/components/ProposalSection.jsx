import { useState } from 'react'
import { useProposals, PROPOSAL_THRESHOLD } from '../hooks/useProposals'

export default function ProposalSection({ user, onLoginRequest }) {
  const { proposals, userVotes, loading, propose, vote } = useProposals(user)
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', role: '', party: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handlePropose(e) {
    e.preventDefault()
    if (!user) { onLoginRequest(); return }
    setSubmitting(true)
    setError('')
    try {
      await propose(form.name, form.role, form.party)
      setForm({ name: '', role: '', party: '' })
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVote(id) {
    if (!user) { onLoginRequest(); return }
    await vote(id)
  }

  return (
    <div style={s.wrap}>
      <button style={s.toggle} onClick={() => setOpen(v => !v)}>
        {open ? '▲ Cerrar' : '+ ¿Falta algún político?'}
        {!open && proposals.length > 0 && (
          <span style={s.badge}>{proposals.length}</span>
        )}
      </button>

      {open && (
        <div style={s.body}>
          {loading ? (
            <p style={s.dim}>Cargando...</p>
          ) : (
            <>
              {proposals.length === 0 && !showForm && (
                <p style={s.dim}>Aún no hay propuestas.</p>
              )}

              {proposals.map(p => {
                const voted = userVotes.has(p.id)
                const ready = Number(p.vote_count) >= PROPOSAL_THRESHOLD
                return (
                  <div key={p.id} style={s.row}>
                    <div style={s.polInfo}>
                      <span style={s.polName}>{p.name}</span>
                      {p.role && <span style={s.polRole}>{p.role}{p.party ? ` · ${p.party}` : ''}</span>}
                    </div>
                    <div style={s.rowRight}>
                      {ready && <span style={s.readyBadge}>✓ Listo ({PROPOSAL_THRESHOLD})</span>}
                      <button
                        style={{ ...s.voteBtn, ...(voted ? s.votedBtn : {}) }}
                        onClick={() => handleVote(p.id)}
                        title={voted ? 'Quitar voto' : 'Votar para agregar'}
                      >
                        ▲ {p.vote_count}
                      </button>
                    </div>
                  </div>
                )
              })}

              {showForm ? (
                <form onSubmit={handlePropose} style={s.form}>
                  <input
                    style={s.input} placeholder="Nombre completo *"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required autoFocus
                  />
                  <input
                    style={s.input} placeholder="Cargo (opcional)"
                    value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  />
                  <input
                    style={s.input} placeholder="Partido (opcional)"
                    value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))}
                  />
                  {error && <p style={s.err}>{error}</p>}
                  <div style={s.formBtns}>
                    <button style={s.submitBtn} type="submit" disabled={submitting}>
                      {submitting ? 'Enviando...' : 'Proponer'}
                    </button>
                    <button style={s.cancelBtn} type="button" onClick={() => setShowForm(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <button style={s.proposeBtn} onClick={() => user ? setShowForm(true) : onLoginRequest()}>
                  + Proponer político
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  wrap: { marginTop: '2rem', borderTop: '1px solid #1e1e2e', paddingTop: '1rem' },
  toggle: {
    background: 'none', border: 'none', color: '#555',
    fontSize: '0.85rem', cursor: 'pointer', display: 'flex',
    alignItems: 'center', gap: '0.5rem',
  },
  badge: {
    background: '#252535', color: '#888', borderRadius: '10px',
    fontSize: '0.7rem', padding: '1px 7px',
  },
  body: { marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  dim: { fontSize: '0.82rem', color: '#444' },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.5rem 0.75rem', background: '#13131e',
    border: '1px solid #1e1e2e', borderRadius: '8px',
  },
  polInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  polName: { fontSize: '0.85rem', color: '#ccc', fontWeight: 600 },
  polRole: { fontSize: '0.73rem', color: '#666' },
  rowRight: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  readyBadge: { fontSize: '0.7rem', color: '#4ade80', background: '#14532d', borderRadius: '4px', padding: '2px 6px' },
  voteBtn: {
    background: '#1a1a28', border: '1px solid #252535',
    borderRadius: '6px', color: '#888',
    fontSize: '0.78rem', padding: '0.25rem 0.6rem', cursor: 'pointer',
  },
  votedBtn: { border: '1px solid #3b5bdb', color: '#4f6ef7', background: '#1a1a38' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' },
  input: {
    background: '#0f0f13', border: '1px solid #252535',
    borderRadius: '7px', color: '#e8e8e8',
    fontSize: '0.85rem', padding: '0.5rem 0.75rem', outline: 'none',
  },
  err: { fontSize: '0.78rem', color: '#f87171' },
  formBtns: { display: 'flex', gap: '0.5rem' },
  submitBtn: {
    background: '#3b5bdb', border: 'none', borderRadius: '7px',
    color: '#fff', fontWeight: 600, fontSize: '0.85rem',
    padding: '0.45rem 1rem', cursor: 'pointer',
  },
  cancelBtn: {
    background: 'none', border: '1px solid #252535', borderRadius: '7px',
    color: '#666', fontSize: '0.85rem', padding: '0.45rem 0.75rem', cursor: 'pointer',
  },
  proposeBtn: {
    background: 'none', border: '1px dashed #252535', borderRadius: '7px',
    color: '#555', fontSize: '0.82rem', padding: '0.5rem 1rem',
    cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.25rem',
  },
}
