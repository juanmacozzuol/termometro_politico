import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthModal({ onClose }) {
  const { sendOTP, verifyOTP } = useAuth()
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef([])

  async function handleSendOTP(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendOTP(email)
      setStep('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOTP(email, otp.join(''))
      onClose()
    } catch (err) {
      setError('Código incorrecto o expirado')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index, value) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.close} onClick={onClose}>✕</button>

        {step === 'email' ? (
          <form onSubmit={handleSendOTP}>
            <h2 style={styles.title}>Ingresá tu email</h2>
            <p style={styles.subtitle}>Te enviamos un código de 6 dígitos para confirmar tu identidad.</p>
            <input
              style={styles.input}
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <h2 style={styles.title}>Ingresá el código</h2>
            <p style={styles.subtitle}>Enviamos un código a <strong>{email}</strong></p>
            <div style={styles.otpRow} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  style={styles.otpInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.button} type="submit" disabled={loading || otp.join('').length < 6}>
              {loading ? 'Verificando...' : 'Confirmar'}
            </button>
            <button type="button" style={styles.link} onClick={() => { setStep('email'); setOtp(['','','','','','']); setError('') }}>
              Cambiar email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#1a1a24',
    border: '1px solid #2e2e40',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '360px',
    position: 'relative',
  },
  close: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '1rem',
  },
  title: {
    fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#999', fontSize: '0.875rem', marginBottom: '1.25rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    background: '#0f0f13', border: '1px solid #2e2e40',
    borderRadius: '8px', color: '#e8e8e8', fontSize: '1rem',
    outline: 'none', marginBottom: '1rem',
  },
  button: {
    width: '100%', padding: '0.75rem',
    background: '#4f6ef7', border: 'none',
    borderRadius: '8px', color: '#fff',
    fontSize: '1rem', fontWeight: 600,
    cursor: 'pointer', marginTop: '0.25rem',
  },
  otpRow: {
    display: 'flex', gap: '0.5rem',
    justifyContent: 'center', marginBottom: '1rem',
  },
  otpInput: {
    width: '44px', height: '52px',
    textAlign: 'center', fontSize: '1.5rem',
    background: '#0f0f13', border: '1px solid #2e2e40',
    borderRadius: '8px', color: '#e8e8e8', outline: 'none',
  },
  error: {
    color: '#f87171', fontSize: '0.875rem', marginBottom: '0.75rem',
  },
  link: {
    background: 'none', border: 'none', color: '#4f6ef7',
    cursor: 'pointer', fontSize: '0.875rem',
    display: 'block', margin: '0.75rem auto 0',
  },
}
