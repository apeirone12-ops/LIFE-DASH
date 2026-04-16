import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Verificamos si ya hay una sesión
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        // ¡ESTE ES EL TRUCO! 
        // Si en la URL hay un "#", significa que Google nos está mandando el token.
        // NO dejamos de cargar todavía, esperamos a que el 'onAuthStateChange' lo atrape.
        if (!window.location.hash.includes('access_token')) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // 2. ESCUCHADOR EN TIEMPO REAL
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("⚡ EVENTO DETECTADO:", event)
      
      if (session) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
        // Solo dejamos de cargar si no estamos en medio de un proceso de login
        if (!window.location.hash.includes('access_token')) {
          setLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) setProfile(data)
    } finally {
      setLoading(false) // Siempre terminamos de cargar aquí
    }
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        // IMPORTANTE: Redirigimos directo a /app
        redirectTo: `${window.location.origin}/app` 
      }
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
useEffect(() => {
  // 1. Verificamos sesión inicial
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      setUser(session.user)
      fetchProfile(session.user.id)
    } else {
      // Si estamos volviendo de Google (hay un # en la URL), NO dejamos de cargar
      if (!window.location.hash.includes('access_token')) {
        setLoading(false)
      }
    }
  })

  // 2. Escuchador de eventos
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Evento Auth:", event)
    
    if (session) {
      setUser(session.user)
      await fetchProfile(session.user.id)
      setLoading(false) // Recién acá decimos que terminó de cargar
    } else if (event === 'SIGNED_OUT') {
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  })

  return () => subscription.unsubscribe()
}, [])
