import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { Plus, ChevronLeft, ChevronRight, X, Bell, CheckSquare, StickyNote, Trash2, Check } from 'lucide-react'

dayjs.locale('es')

const TABS = ['Calendario', 'Tareas', 'Recordatorios', 'Notas']
const COLORS = ['#7c6af7', '#34d399', '#f472b6', '#f59e0b', '#3b82f6', '#f87171']

export default function Agenda() {
  const { user } = useAuth()
  const [tab, setTab] = useState('Calendario')
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [events, setEvents] = useState([])
  const [tasks, setTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedDay, setSelectedDay] = useState(dayjs())
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('event')
  const [loading, setLoading] = useState(true)

  // Form states
  const [eTitle, setETitle] = useState('')
  const [eDesc, setEDesc] = useState('')
  const [eDate, setEDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [eTime, setETime] = useState('10:00')
  const [eColor, setEColor] = useState(COLORS[0])
  const [tTitle, setTTitle] = useState('')
  const [tDue, setTDue] = useState('')
  const [tPriority, setTPriority] = useState('media')
  const [rTitle, setRTitle] = useState('')
  const [rDate, setRDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [rTime, setRTime] = useState('09:00')
  const [nTitle, setNTitle] = useState('')
  const [nContent, setNContent] = useState('')

  useEffect(() => { if (user) fetchAll() }, [user])

  async function fetchAll() {
    setLoading(true)
    const [ev, ta, re, no] = await Promise.all([
      supabase.from('events').select('*').eq('user_id', user.id).order('date'),
      supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('reminders').select('*').eq('user_id', user.id).order('date'),
      supabase.from('notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setEvents(ev.data || [])
    setTasks(ta.data || [])
    setReminders(re.data || [])
    setNotes(no.data || [])
    setLoading(false)
  }

  // Calendar helpers
  const startOfMonth = currentMonth.startOf('month')
  const startDay = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1
  const daysInMonth = currentMonth.daysInMonth()
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7

  function eventsForDay(d) {
    const dateStr = currentMonth.date(d).format('YYYY-MM-DD')
    return events.filter(e => e.date === dateStr)
  }

  async function addEvent() {
    if (!eTitle.trim()) return
    const { data } = await supabase.from('events').insert({
      user_id: user.id, title: eTitle, description: eDesc,
      date: eDate, time: eTime, color: eColor
    }).select().single()
    if (data) setEvents(prev => [...prev, data])
    setETitle(''); setEDesc(''); setShowModal(false)
  }

  async function addTask() {
    if (!tTitle.trim()) return
    const { data } = await supabase.from('tasks').insert({
      user_id: user.id, title: tTitle, due_date: tDue || null,
      priority: tPriority, completed: false
    }).select().single()
    if (data) setTasks(prev => [data, ...prev])
    setTTitle(''); setTDue(''); setShowModal(false)
  }

  async function toggleTask(id, completed) {
    await supabase.from('tasks').update({ completed: !completed }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function addReminder() {
    if (!rTitle.trim()) return
    const { data } = await supabase.from('reminders').insert({
      user_id: user.id, title: rTitle, date: rDate, time: rTime
    }).select().single()
    if (data) setReminders(prev => [...prev, data])
    setRTitle(''); setShowModal(false)
  }

  async function deleteReminder(id) {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  async function addNote() {
    if (!nTitle.trim()) return
    const { data } = await supabase.from('notes').insert({
      user_id: user.id, title: nTitle, content: nContent
    }).select().single()
    if (data) setNotes(prev => [data, ...prev])
    setNTitle(''); setNContent(''); setShowModal(false)
  }

  async function deleteNote(id) {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  async function deleteEvent(id) {
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const PRIORITY_COLOR = { alta: '#f87171', media: '#fbbf24', baja: '#34d399' }

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>Agenda</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setModalType(tab === 'Calendario' ? 'event' : tab === 'Tareas' ? 'task' : tab === 'Recordatorios' ? 'reminder' : 'note')
            setShowModal(true)
          }}
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'Outfit, sans-serif',
            background: tab === t ? 'var(--accent)' : 'transparent',
            color: tab === t ? 'white' : 'var(--text-secondary)',
            transition: 'all 0.18s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* CALENDARIO */}
      {tab === 'Calendario' && (
        <div className="animate-fade-in">
          <div className="card" style={{ marginBottom: 16 }}>
            {/* Month nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))} className="btn-ghost" style={{ padding: '6px 10px' }}>
                <ChevronLeft size={16} />
              </button>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {currentMonth.format('MMMM YYYY')}
              </h2>
              <button onClick={() => setCurrentMonth(m => m.add(1, 'month'))} className="btn-ghost" style={{ padding: '6px 10px' }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Days header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {Array.from({ length: totalCells }).map((_, i) => {
                const dayNum = i - startDay + 1
                const isValid = dayNum >= 1 && dayNum <= daysInMonth
                const isToday = isValid && currentMonth.date(dayNum).isSame(dayjs(), 'day')
                const isSelected = isValid && currentMonth.date(dayNum).isSame(selectedDay, 'day')
                const dayEvents = isValid ? eventsForDay(dayNum) : []

                return (
                  <div
                    key={i}
                    onClick={() => isValid && setSelectedDay(currentMonth.date(dayNum))}
                    style={{
                      minHeight: 64,
                      borderRadius: 10,
                      padding: '6px 8px',
                      cursor: isValid ? 'pointer' : 'default',
                      background: isSelected ? 'var(--accent-glow)' : isValid ? 'var(--bg-secondary)' : 'transparent',
                      border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => isValid && (e.currentTarget.style.borderColor = 'var(--border)')}
                    onMouseLeave={e => e.currentTarget.style.borderColor = isToday ? 'var(--accent)' : 'transparent'}
                  >
                    {isValid && (
                      <>
                        <div style={{
                          fontSize: 13, fontWeight: isToday ? 700 : 400,
                          color: isToday ? 'var(--accent)' : isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          marginBottom: 4,
                        }}>{dayNum}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {dayEvents.slice(0, 2).map(ev => (
                            <div key={ev.id} style={{
                              fontSize: 10, background: ev.color + '33',
                              color: ev.color, borderRadius: 4, padding: '1px 4px',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>{ev.title}</div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>+{dayEvents.length - 2} más</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected day events */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14, textTransform: 'capitalize' }}>
              {selectedDay.format('dddd D [de] MMMM')}
            </h3>
            {events.filter(e => e.date === selectedDay.format('YYYY-MM-DD')).length === 0
              ? <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sin eventos este día.</p>
              : events.filter(e => e.date === selectedDay.format('YYYY-MM-DD')).map(ev => (
                <div key={ev.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                  background: ev.color + '15', borderLeft: `3px solid ${ev.color}`,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{ev.title}</div>
                    {ev.time && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>🕐 {ev.time}</div>}
                    {ev.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{ev.description}</div>}
                  </div>
                  <button onClick={() => deleteEvent(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* TAREAS */}
      {tab === 'Tareas' && (
        <div className="animate-fade-in">
          {tasks.length === 0 && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              <CheckSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No tenés tareas. ¡Agregá una!</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map(t => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                transition: 'opacity 0.2s',
                opacity: t.completed ? 0.55 : 1,
              }}>
                <button
                  onClick={() => toggleTask(t.id, t.completed)}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${t.completed ? 'var(--success)' : 'var(--border)'}`,
                    background: t.completed ? 'var(--success)' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  {t.completed && <Check size={12} color="white" />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
                    textDecoration: t.completed ? 'line-through' : 'none',
                  }}>{t.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    {t.due_date && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📅 {dayjs(t.due_date).format('D MMM')}</span>}
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 99,
                      background: PRIORITY_COLOR[t.priority] + '25',
                      color: PRIORITY_COLOR[t.priority],
                    }}>{t.priority}</span>
                  </div>
                </div>
                <button onClick={() => deleteTask(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECORDATORIOS */}
      {tab === 'Recordatorios' && (
        <div className="animate-fade-in">
          {reminders.length === 0 && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No tenés recordatorios.</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reminders.sort((a, b) => a.date > b.date ? 1 : -1).map(r => (
              <div key={r.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', borderRadius: 12,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--accent-glow)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bell size={16} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      📅 {dayjs(r.date).format('D MMM YYYY')} {r.time && `⏰ ${r.time}`}
                    </div>
                  </div>
                </div>
                <button onClick={() => deleteReminder(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTAS */}
      {tab === 'Notas' && (
        <div className="animate-fade-in">
          {notes.length === 0 && !loading && (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              <StickyNote size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No tenés notas.</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {notes.map(n => (
              <div key={n.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 18px 14px', position: 'relative',
              }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.content}</div>
                <button
                  onClick={() => deleteNote(n.id)}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500,
        }} onClick={() => setShowModal(false)}>
          <div className="animate-fade-in card" style={{ width: '100%', maxWidth: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                {modalType === 'event' ? 'Nuevo evento' : modalType === 'task' ? 'Nueva tarea' : modalType === 'reminder' ? 'Nuevo recordatorio' : 'Nueva nota'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            {modalType === 'event' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="Título del evento *" />
                <textarea value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Descripción (opcional)" rows={3} style={{ resize: 'vertical' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Fecha</label><input type="date" value={eDate} onChange={e => setEDate(e.target.value)} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Hora</label><input type="time" value={eTime} onChange={e => setETime(e.target.value)} /></div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setEColor(c)} style={{
                        width: 28, height: 28, borderRadius: '50%', background: c, border: eColor === c ? '3px solid white' : '3px solid transparent',
                        cursor: 'pointer', outline: eColor === c ? `2px solid ${c}` : 'none',
                      }} />
                    ))}
                  </div>
                </div>
                <button className="btn-primary" onClick={addEvent} style={{ marginTop: 4 }}>Guardar evento</button>
              </div>
            )}

            {modalType === 'task' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={tTitle} onChange={e => setTTitle(e.target.value)} placeholder="Título de la tarea *" />
                <div><label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Fecha límite (opcional)</label>
                  <input type="date" value={tDue} onChange={e => setTDue(e.target.value)} /></div>
                <div><label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Prioridad</label>
                  <select value={tPriority} onChange={e => setTPriority(e.target.value)}>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select></div>
                <button className="btn-primary" onClick={addTask} style={{ marginTop: 4 }}>Guardar tarea</button>
              </div>
            )}

            {modalType === 'reminder' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={rTitle} onChange={e => setRTitle(e.target.value)} placeholder="¿Qué querés recordar? *" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Fecha</label><input type="date" value={rDate} onChange={e => setRDate(e.target.value)} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Hora</label><input type="time" value={rTime} onChange={e => setRTime(e.target.value)} /></div>
                </div>
                <button className="btn-primary" onClick={addReminder} style={{ marginTop: 4 }}>Guardar recordatorio</button>
              </div>
            )}

            {modalType === 'note' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="Título de la nota *" />
                <textarea value={nContent} onChange={e => setNContent(e.target.value)} placeholder="Escribí tu nota acá..." rows={6} style={{ resize: 'vertical' }} />
                <button className="btn-primary" onClick={addNote} style={{ marginTop: 4 }}>Guardar nota</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
