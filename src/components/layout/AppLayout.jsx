import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  CalendarDays, TrendingUp, LineChart, GraduationCap,
  Settings, LogOut, Menu, X, User
} from 'lucide-react'

const NAV = [
  { to: '/app/agenda', icon: CalendarDays, label: 'Agenda', color: '#7c6af7' },
  { to: '/app/finanzas', icon: TrendingUp, label: 'Finanzas', color: '#34d399' },
  { to: '/app/inversiones', icon: LineChart, label: 'Inversiones', color: '#3b82f6' },
  { to: '/app/facultad', icon: GraduationCap, label: 'Facultad', color: '#f59e0b' },
]

export default function AppLayout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url
  const name = profile?.full_name || user?.user_metadata?.full_name || 'Usuario'
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const sidebarW = collapsed ? 64 : 240

  const SidebarInner = () => (
    <div style={{
      width: sidebarW,
      height: '100vh',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border)',
        minHeight: 60,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              Mi App
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: 6, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ to, icon: Icon, label, color }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: collapsed ? '11px 0' : '11px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 10,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 14,
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              borderLeft: isActive && !collapsed ? `3px solid var(--accent)` : '3px solid transparent',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : color + '99' }} />
                {!collapsed && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: perfil */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={() => { navigate('/app/perfil'); setMobileOpen(false) }}
          style={{
            display: 'flex', alignItems: 'center',
            gap: 10, padding: collapsed ? '10px 0' : '10px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10, border: 'none', background: 'transparent',
            cursor: 'pointer', width: '100%', transition: 'all 0.18s',
            color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-glow)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          {avatar
            ? <img src={avatar} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
              }}>{initials}</div>
          }
          {!collapsed && (
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                {name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Perfil</div>
            </div>
          )}
        </button>

        <button
          onClick={signOut}
          style={{
            display: 'flex', alignItems: 'center',
            gap: 10, padding: collapsed ? '10px 0' : '10px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 10, border: 'none', background: 'transparent',
            cursor: 'pointer', width: '100%', fontSize: 13, fontWeight: 500,
            color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar desktop */}
      <div style={{ display: 'flex' }} className="hidden md:flex">
        <SidebarInner />
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(o => !o)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 1000,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 10, cursor: 'pointer',
          color: 'var(--text-primary)', display: 'none',
        }}
        className="mobile-menu-btn"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999 }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div style={{
        position: 'fixed', left: mobileOpen ? 0 : -280, top: 0, bottom: 0, zIndex: 1000,
        transition: 'left 0.3s ease',
      }}>
        <SidebarInner />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .hidden.md\\:flex { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
