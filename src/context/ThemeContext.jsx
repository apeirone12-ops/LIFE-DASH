import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const ThemeContext = createContext({})

export const THEMES = [
  { id: 'default', name: 'Cosmic', accent: '#7c6af7', preview: ['#0f0f13', '#7c6af7'] },
  { id: 'aurora', name: 'Aurora', accent: '#3b82f6', preview: ['#080b14', '#3b82f6'] },
  { id: 'sunset', name: 'Sunset', accent: '#f472b6', preview: ['#130810', '#f472b6'] },
  { id: 'forest', name: 'Forest', accent: '#34d399', preview: ['#080f0a', '#34d399'] },
  { id: 'amber', name: 'Amber', accent: '#f59e0b', preview: ['#110d00', '#f59e0b'] },
  { id: 'light', name: 'Claro', accent: '#7c6af7', preview: ['#f0f0f5', '#7c6af7'] },
]

export function ThemeProvider({ children }) {
  const { user, profile } = useAuth()
  const [theme, setThemeState] = useState('default')
  const [customBg, setCustomBgState] = useState(null)
  const [customAccent, setCustomAccentState] = useState(null)

  useEffect(() => {
    if (profile) {
      if (profile.theme) applyTheme(profile.theme)
      if (profile.custom_bg) applyBg(profile.custom_bg)
      if (profile.custom_accent) applyAccent(profile.custom_accent)
    }
  }, [profile])

  function applyTheme(t) {
    setThemeState(t)
    document.documentElement.setAttribute('data-theme', t)
  }

  function applyBg(url) {
    setCustomBgState(url)
    document.body.style.setProperty('--custom-bg-url', `url(${url})`)
    document.body.classList.add('custom-bg')
  }

  function applyAccent(color) {
    setCustomAccentState(color)
    document.documentElement.style.setProperty('--accent', color)
  }

  async function setTheme(t) {
    applyTheme(t)
    if (user) await supabase.from('profiles').update({ theme: t }).eq('id', user.id)
  }

  async function setCustomBg(url) {
    applyBg(url)
    if (user) await supabase.from('profiles').update({ custom_bg: url }).eq('id', user.id)
  }

  async function clearCustomBg() {
    setCustomBgState(null)
    document.body.style.removeProperty('--custom-bg-url')
    document.body.classList.remove('custom-bg')
    if (user) await supabase.from('profiles').update({ custom_bg: null }).eq('id', user.id)
  }

  async function setCustomAccent(color) {
    applyAccent(color)
    if (user) await supabase.from('profiles').update({ custom_accent: color }).eq('id', user.id)
  }

  return (
    <ThemeContext.Provider value={{
      theme, setTheme, customBg, setCustomBg, clearCustomBg,
      customAccent, setCustomAccent, themes: THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
