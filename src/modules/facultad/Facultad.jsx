import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, X, BookOpen, Calendar, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'

const TABS = ['Materias', 'Exámenes', 'Notas']
const ESTADOS = ['Cursando', 'Final pendiente', 'Aprobada', 'Libre']
const ESTADO_COLORS = {
  'Cursando': '#3b82f6',
  'Final pendiente': '#f59e0b',
  'Aprobada': '#34d399',
  'Libre': '#f87171',
}
const TIPO_EXAMEN = ['Parcial', 'Final', 'Recuperatorio', 'Quiz', 'Trabajo Práctico']

export default function Facultad() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Materias')
  const [materias, setMaterias] = useState([])
  const [examenes, setExamenes] = useState([])
  const [notas, setNotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [expandedMateria, setExpandedMateria] = useState(null)
  const [editingNote, setEditingNote] = useState(null)

  // Form materias
  const [mNombre, setMNombre] = useState('')
  const [mProfesor, setMProfesor] = useState('')
  const [mEstado, setMEstado] = useState('Cursando')
  const [mDias, setMDias] = useState('')
  const [mAula, setMAula] = useState('')
  const [mColor, setMColor] = useState('#7c6af7')

  // Form exámenes
  const [eNombre, setENombre] = useState('')
  const [eMateria, setEMateria] = useState('')
  const [eTipo, setETipo] = useState('Parcial')
  const [eFecha, setEFecha] = useState(dayjs().format('YYYY-MM-DD'))
  const [eHora, setEHora] = useState('10:00')
  const [eAula, setEAula] = useState('')
  const [eNota, setENota] = useState('')

  // Form notas
  const [nTitulo, setNTitulo] = useState('')
  const [nContenido, setNContenido] = useState('')
  const [nMateria, setNMateria] = useState('')

  const COLORS = ['#7c6af7', '#3b82f6', '#34d399', '#f472b6', '#f59e0b', '#f87171', '#a78bfa', '#fb923c']

  useEffect(() => { if (user) fetchAll() }, [user])

  async function fetchAll() {
    setLoading(true)
    const [ma, ex, no] = await Promise.all([
      supabase.from('materias').select('*').eq('user_id', user.id).order('nombre'),
      supabase.from('examenes').select('*').eq('user_id', user.id).order('fecha'),
      supabase.from('notas_facultad').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    ])
    setMaterias(ma.data || [])
    setExamenes(ex.data || [])
    setNotas(no.data || [])
    setLoading(false)
  }

  async function addMateria() {
    if (!mNombre.trim()) return
    const { data } = await supabase.from('materias').insert({
      user_id: user.id, nombre: mNombre, profesor: mProfesor,
      estado: mEstado, dias: mDias, aula: mAula, color: mColor,
    }).select().single()
    if (data) setMaterias(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setMNombre(''); setMProfesor(''); setMDias(''); setMAula('')
    setShowModal(false)
  }

  async function deleteMateria(id) {
    await supabase.from('materias').delete().eq('id', id)
    setMaterias(prev => prev.filter(m => m.id !== id))
  }

  async function addExamen() {
    if (!eNombre.trim()) return
    const { data } = await supabase.from('examenes').insert({
      user_id: user.id, nombre: eNombre,
      materia_id: eMateria || null, tipo: eTipo,
      fecha: eFecha, hora: eHora, aula: eAula,
      nota_obtenida: eNota ? parseFloat(eNota) : null,
    }).select().single()
    if (data) setExamenes(prev => [...prev, data].sort((a, b) => a.fecha > b.fecha ? 1 : -1))
    setENombre(''); setEMateria(''); setEAula(''); setENota('')
    setShowModal(false)
  }

  async function deleteExamen(id) {
    await supabase.from('examenes').delete().eq('id', id)
    setExamenes(prev => prev.filter(e => e.id !== id))
  }

  async function addNota() {
    if (!nTitulo.trim()) return
    const { data } = await supabase.from('notas_facultad').insert({
      user_id: user.id, titulo: nTitulo,
      contenido: nContenido, materia_id: nMateria || null,
    }).select().single()
    if (data) setNotas(prev => [data, ...prev])
    setNTitulo(''); setNContenido(''); setNMateria('')
    setShowModal(false)
  }

  async function updateNota(id, contenido) {
    await supabase.from('notas_facultad').update({ contenido, updated_at: new Date().toISOString() }).eq('id', id)
    setNotas(prev => prev.map(n => n.id === id ? { ...n, contenido } : n))
  }

  async function deleteNota(id) {
    await supabase.from('notas_facultad').delete().eq('id', id)
    setNotas(prev => prev.filter(n => n.id !== id))
  }

  const proximosExamenes = examenes
    .filter(e => dayjs(e.fecha).isAfter(dayjs().subtract(1, 'day')))
    .slice(0, 5)

  const diasHasta = (fecha) => {
    const d = dayjs(fecha).diff(dayjs(), 'day')
    if (d === 0) return 'Hoy'
    if (d === 1) return 'Mañana'
    if (d < 0) return `Hace ${Math.abs(d)} días`
    return `En ${d} días`
  }

  const getMateriaColor = (id) => materias.find(m => m.id === id)?.color || '#7c6af7'
  const getMateriaNombre = (id) => materias.find(m => m.id === id)?.nombre || '—'

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>Facultad</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          {tab === 'Materias' ? 'Materia' : tab === 'Exámenes' ? 'Examen' : 'Nota'}
        </button>
      </div>

      {/* Próximos exámenes banner */}
      {proximosExamenes.length > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
          {proximosExamenes.map(e => (
            <div key={e.id} style={{
              flexShrink: 0, padding: '12px 16px', borderRadius: 12,
              background: 'var(--bg-card)', border: `1px solid ${getMateriaColor(e.materia_id)}44`,
              borderLeft: `3px solid ${getMateriaColor(e.materia_id)}`,
              minWidth: 180,
            }}>
              <div style={{ fontSize: 11, color: getMateriaColor(e.materia_id), fontWeight: 600, marginBottom: 4 }}>
                {e.tipo} · {diasHasta(e.fecha)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{e.nombre}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                {dayjs(e.fecha).format('D MMM')} {e.hora && `· ${e.hora}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'Outfit, sans-serif',
            background: tab === t ? 'var(--accent)' : 'transparent',
            color: tab === t ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.18s',
          }}>{t}</button>
        ))}
      </div>

      {/* MATERIAS */}
      {tab === 'Materias' && (
        <div className="animate-fade-in">
          {materias.length === 0 && !loading ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
              <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Agregá tus materias del cuatrimestre</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {materias.map(m => {
                const exsMat = examenes.filter(e => e.materia_id === m.id)
                const expanded = expandedMateria === m.id
                return (
                  <div key={m.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                        cursor: 'pointer', borderLeft: `4px solid ${m.color}`,
                      }}
                      onClick={() => setExpandedMateria(expanded ? null : m.id)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{m.nombre}</span>
                          <span style={{
                            fontSize: 11, padding: '2px 9px', borderRadius: 99,
                            background: ESTADO_COLORS[m.estado] + '25',
                            color: ESTADO_COLORS[m.estado], fontWeight: 500,
                          }}>{m.estado}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 12 }}>
                          {m.profesor && <span>👨‍🏫 {m.profesor}</span>}
                          {m.dias && <span>📅 {m.dias}</span>}
                          {m.aula && <span>🚪 Aula {m.aula}</span>}
                          {exsMat.length > 0 && <span>📝 {exsMat.length} exámenes</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {expanded ? <ChevronDown size={16} color="var(--text-secondary)" /> : <ChevronRight size={16} color="var(--text-secondary)" />}
                        <button onClick={e => { e.stopPropagation(); deleteMateria(m.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {expanded && exsMat.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>EXÁMENES</div>
                        {exsMat.map(ex => (
                          <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                            <div>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ex.nombre}</span>
                              <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{ex.tipo} · {dayjs(ex.fecha).format('D MMM YYYY')}</span>
                            </div>
                            {ex.nota_obtenida !== null && (
                              <span style={{
                                fontWeight: 700, fontSize: 14,
                                color: ex.nota_obtenida >= 6 ? '#34d399' : '#f87171',
                              }}>{ex.nota_obtenida}/10</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* EXÁMENES */}
      {tab === 'Exámenes' && (
        <div className="animate-fade-in">
          {examenes.length === 0 && !loading ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
              <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No hay exámenes cargados</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {examenes.map(e => {
                const isPast = dayjs(e.fecha).isBefore(dayjs(), 'day')
                const color = getMateriaColor(e.materia_id)
                return (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 18px', borderRadius: 12,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderLeft: `3px solid ${color}`,
                    opacity: isPast && !e.nota_obtenida ? 0.6 : 1,
                  }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        📝
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{e.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, display: 'flex', gap: 10 }}>
                          <span style={{ color, fontWeight: 500 }}>{e.tipo}</span>
                          {e.materia_id && <span>{getMateriaNombre(e.materia_id)}</span>}
                          <span>{dayjs(e.fecha).format('D MMM YYYY')} {e.hora && `· ${e.hora}hs`}</span>
                          {e.aula && <span>Aula {e.aula}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {!isPast && (
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
                          background: color + '20', color,
                        }}>{diasHasta(e.fecha)}</span>
                      )}
                      {e.nota_obtenida !== null && (
                        <span style={{
                          fontSize: 18, fontWeight: 800,
                          color: e.nota_obtenida >= 6 ? '#34d399' : '#f87171',
                        }}>{e.nota_obtenida}/10</span>
                      )}
                      <button onClick={() => deleteExamen(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* NOTAS estilo Notion */}
      {tab === 'Notas' && (
        <div className="animate-fade-in">
          {editingNote ? (
            // Editor de nota
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button
                  className="btn-ghost"
                  onClick={() => setEditingNote(null)}
                  style={{ fontSize: 13, padding: '8px 14px' }}
                >
                  ← Volver
                </button>
                <button
                  className="btn-primary"
                  onClick={() => { updateNota(editingNote.id, editingNote.contenido); setEditingNote(null) }}
                  style={{ fontSize: 13, padding: '8px 18px' }}
                >
                  Guardar
                </button>
              </div>
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {editingNote.materia_id ? getMateriaNombre(editingNote.materia_id) : 'Sin materia'}
                </div>
                <input
                  value={editingNote.titulo}
                  onChange={e => setEditingNote(n => ({ ...n, titulo: e.target.value }))}
                  style={{ fontSize: 22, fontWeight: 700, border: 'none', background: 'transparent', color: 'var(--text-primary)', marginBottom: 16, padding: 0 }}
                  placeholder="Título"
                />
                <textarea
                  value={editingNote.contenido || ''}
                  onChange={e => setEditingNote(n => ({ ...n, contenido: e.target.value }))}
                  placeholder="Escribí tu nota acá... Podés usar texto libre, listas, apuntes, lo que quieras."
                  style={{
                    width: '100%', minHeight: 400, resize: 'vertical',
                    border: 'none', background: 'transparent',
                    color: 'var(--text-primary)', fontSize: 14,
                    lineHeight: 1.8, padding: 0, outline: 'none',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                />
              </div>
            </div>
          ) : (
            // Lista de notas
            <>
              {notas.length === 0 && !loading ? (
                <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                  <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>Sin notas. ¡Creá tu primer apunte!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {notas.map(n => {
                    const color = getMateriaColor(n.materia_id)
                    return (
                      <div
                        key={n.id}
                        onClick={() => setEditingNote({ ...n })}
                        style={{
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 14, padding: '18px', cursor: 'pointer',
                          transition: 'all 0.2s', position: 'relative',
                          borderTop: `3px solid ${n.materia_id ? color : 'var(--accent)'}`,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                      >
                        {n.materia_id && (
                          <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 6 }}>
                            {getMateriaNombre(n.materia_id)}
                          </div>
                        )}
                        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>{n.titulo}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {n.contenido || 'Sin contenido'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 12, opacity: 0.6 }}>
                          {dayjs(n.updated_at || n.created_at).format('D MMM YYYY')}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteNota(n.id) }}
                          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={() => setShowModal(false)}>
          <div className="animate-fade-in card" style={{ width: '100%', maxWidth: 460, padding: 28, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {tab === 'Materias' ? 'Nueva materia' : tab === 'Exámenes' ? 'Nuevo examen' : 'Nueva nota'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>

            {tab === 'Materias' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={mNombre} onChange={e => setMNombre(e.target.value)} placeholder="Nombre de la materia *" />
                <input value={mProfesor} onChange={e => setMProfesor(e.target.value)} placeholder="Profesor/a" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input value={mDias} onChange={e => setMDias(e.target.value)} placeholder="Días (Lun, Mié)" />
                  <input value={mAula} onChange={e => setMAula(e.target.value)} placeholder="Aula" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Estado</label>
                  <select value={mEstado} onChange={e => setMEstado(e.target.value)}>
                    {ESTADOS.map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setMColor(c)} style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                        outline: mColor === c ? `3px solid ${c}` : 'none',
                        outlineOffset: 2, transition: 'all 0.15s',
                      }} />
                    ))}
                  </div>
                </div>
                <button className="btn-primary" onClick={addMateria} style={{ marginTop: 4 }}>Guardar materia</button>
              </div>
            )}

            {tab === 'Exámenes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={eNombre} onChange={e => setENombre(e.target.value)} placeholder="Nombre del examen *" />
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Materia</label>
                  <select value={eMateria} onChange={e => setEMateria(e.target.value)}>
                    <option value="">Sin materia</option>
                    {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Tipo</label>
                  <select value={eTipo} onChange={e => setETipo(e.target.value)}>
                    {TIPO_EXAMEN.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Fecha</label>
                    <input type="date" value={eFecha} onChange={e => setEFecha(e.target.value)} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Hora</label>
                    <input type="time" value={eHora} onChange={e => setEHora(e.target.value)} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input value={eAula} onChange={e => setEAula(e.target.value)} placeholder="Aula (opcional)" />
                  <input type="number" value={eNota} onChange={e => setENota(e.target.value)} placeholder="Nota (si ya rendiste)" min="0" max="10" />
                </div>
                <button className="btn-primary" onClick={addExamen} style={{ marginTop: 4 }}>Guardar examen</button>
              </div>
            )}

            {tab === 'Notas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={nTitulo} onChange={e => setNTitulo(e.target.value)} placeholder="Título de la nota *" />
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Materia (opcional)</label>
                  <select value={nMateria} onChange={e => setNMateria(e.target.value)}>
                    <option value="">Sin materia</option>
                    {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>
                <textarea value={nContenido} onChange={e => setNContenido(e.target.value)} placeholder="Contenido inicial (opcional)..." rows={4} style={{ resize: 'vertical' }} />
                <button className="btn-primary" onClick={addNota} style={{ marginTop: 4 }}>Crear nota</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
