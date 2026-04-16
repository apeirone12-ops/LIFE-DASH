import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signInWithGoogle, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !loading) navigate('/app/agenda')
  }, [user, loading])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow decorativo */}
      <div style={{
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,247,0.08) 0%, transparent 70%)',
        bottom: '10%', right: '10%',
        pointerEvents: 'none',
      }} />

      <div className="animate-fade-in" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: '52px 44px',
        width: '100%',
        maxWidth: 420,
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 18,
          background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          fontSize: 30,
          boxShadow: '0 8px 24px var(--accent-glow)',
        }}>
          ✦
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
          Bienvenido
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 40, lineHeight: 1.6 }}>
          Tu espacio personal para agenda, finanzas,<br />inversiones y mucho más
        </p>

        <button
          onClick={signInWithGoogle}
          style={{
            width: '100%',
            padding: '15px 24px',
            borderRadius: 13,
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            transition: 'all 0.2s ease',
            fontFamily: 'Outfit, sans-serif',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--accent-glow)'
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--bg-secondary)'
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 32,
        }}>
          {[
            { icon: '📅', label: 'Agenda' },
            { icon: '💰', label: 'Finanzas' },
            { icon: '📈', label: 'Inversiones' },
            { icon: '🎓', label: 'Facultad' },
          ].map(f => (
            <div key={f.label} style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}>
              <span>{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 24, lineHeight: 1.6, opacity: 0.6 }}>
          Al continuar aceptás los términos de uso y política de privacidad
        </p>
      </div>
    </div>
  )
}
