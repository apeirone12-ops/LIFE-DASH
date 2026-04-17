import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

 useEffect(() => {
  const initAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  initAuth()

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    setUser(session?.user ?? null)
    if (session?.user) {
      await fetchProfile(session.user)
    } else {
      setProfile(null)
      setLoading(false)
    }
  })

  return () => subscription.unsubscribe()
}, [])

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) await fetchProfile(session.user)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authUser) {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !data) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: authUser.id,
            full_name: authUser.user_metadata?.full_name || '',
            avatar_url: authUser.user_metadata?.avatar_url || '',
          })
          .select()
          .single()
        setProfile(newProfile)
      } else {
        setProfile(data)
      }
    } catch (e) {
      console.error('Error fetchProfile:', e)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) setProfile(data)
    return { data, error }
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signInWithGoogle, signOut,
      updateProfile,
      fetchProfile: () => user && fetchProfile(user)
    }}> 
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)