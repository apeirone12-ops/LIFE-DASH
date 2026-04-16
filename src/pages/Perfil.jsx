import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme, THEMES } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { Camera, Check, Palette, Image, Phone, Mail, Lock, User } from 'lucide-react'

export default function Perfil() {
  const { user, profile, updateProfile } = useAuth()
  const { theme, setTheme, setCustomBg, clearCustomBg, setCustomAccent, customBg } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || user?.user_metadata?.full_name || '',
    phone: profile?.phone || '',
    username: profile?.username || '',
  })
  const [accentInput, setAccentInput] = useState(profile?.custom_accent || '#7c6af7')
  const [bgUrl, setBgUrl] = useState('')
  const fileRef = useRef()
  const bgFileRef = useRef()

  const avatar = profile?.avatar_url || user?.user_metadata?.avatar_url
  const email = user?.email

  async function handleSave() {
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateProfile({ avatar_url: data.publicUrl + '?t=' + Date.now() })
    }
    setUploadingAvatar(false)
  }

  async function handleBgFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/bg.${ext}`
    const { error } = await supabase.storage.from('backgrounds').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('backgrounds').getPublicUrl(path)
      await setCustomBg(data.publicUrl + '?t=' + Date.now())
    }
  }

  async function handleBgUrl() {
    if (!bgUrl.trim()) return
    await setCustomBg(bgUrl.trim())
    setBgUrl('')
  }

  const initials = form.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <div className="animate-fade-in" style={{ padding: '32px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 28, color: 'var(--text-primary)' }}>
        Mi Perfil
      </h1>

      {/* Avatar */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {avatar
            ? <img src={avatar} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
            : <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: 'white',
              }}>{initials}</div>
          }
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploadingAvatar}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent)', border: '2px solid var(--bg-card)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Camera size={13} color="white" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--text-primary)' }}>{form.full_name || 'Sin nombre'}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{email}</div>
          {uploadingAvatar && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>Subiendo foto...</div>}
        </div>
      </div>

      {/* Datos personales */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={16} color="var(--accent)" /> Datos personales
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Nombre completo</label>
            <input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={12} /> Correo (no editable)
            </label>
            <input value={email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={12} /> Teléfono
            </label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+54 9 341 000 0000"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>Usuario</label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="@usuario"
            />
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ marginTop: 18 }}
        >
          {saved ? <><Check size={15} /> Guardado</> : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Apariencia */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Palette size={16} color="var(--accent)" /> Apariencia
        </h2>

        {/* Temas predeterminados */}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Tema</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              title={t.name}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                border: theme === t.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                cursor: 'pointer',
                background: `linear-gradient(135deg, ${t.preview[0]} 50%, ${t.preview[1]} 100%)`,
                position: 'relative',
                transition: 'transform 0.15s, border-color 0.15s',
                overflow: 'hidden',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {theme === t.id && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.3)',
                }}>
                  <Check size={16} color="white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Color de acento personalizado */}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Color de acento personalizado</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24 }}>
          <input
            type="color"
            value={accentInput}
            onChange={e => setAccentInput(e.target.value)}
            style={{ width: 48, height: 40, padding: 4, cursor: 'pointer', borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <button
            className="btn-ghost"
            onClick={() => setCustomAccent(accentInput)}
            style={{ fontSize: 13, padding: '8px 16px' }}
          >
            Aplicar color
          </button>
        </div>

        {/* Fondo */}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>Fondo de pantalla</p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <input
            value={bgUrl}
            onChange={e => setBgUrl(e.target.value)}
            placeholder="Pegar URL de imagen..."
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={handleBgUrl} style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
            Aplicar
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn-ghost"
            onClick={() => bgFileRef.current.click()}
            style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Image size={14} /> Subir imagen
          </button>
          {customBg && (
            <button
              className="btn-ghost"
              onClick={clearCustomBg}
              style={{ fontSize: 13, color: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              Quitar fondo
            </button>
          )}
          <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBgFile} />
        </div>
        {customBg && (
          <div style={{
            marginTop: 12, borderRadius: 10, overflow: 'hidden',
            height: 80, backgroundImage: `url(${customBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            border: '1px solid var(--border)',
          }} />
        )}
      </div>
    </div>
  )
}
