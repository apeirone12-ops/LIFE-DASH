import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import AppLayout from './components/layout/AppLayout'
import Agenda from './modules/agenda/Agenda'
import Finanzas from './modules/finanzas/Finanzas'
import Inversiones from './modules/inversiones/Inversiones'
import Facultad from './modules/facultad/Facultad'
import Perfil from './pages/Perfil'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-secondary)',
      fontSize: 14,
      gap: 12,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
      }} />
      Cargando...
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={
        <PrivateRoute>
          <ThemeProvider>
            <AppLayout />
          </ThemeProvider>
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="agenda" replace />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="finanzas" element={<Finanzas />} />
        <Route path="inversiones" element={<Inversiones />} />
        <Route path="facultad" element={<Facultad />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
