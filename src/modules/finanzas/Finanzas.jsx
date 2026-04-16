import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, X } from 'lucide-react'
import dayjs from 'dayjs'

const CATEGORIAS_GASTO = ['Comida', 'Transporte', 'Vivienda', 'Salud', 'Entretenimiento', 'Ropa', 'Educación', 'Servicios', 'Otros']
const CATEGORIAS_INGRESO = ['Sueldo', 'Freelance', 'Inversiones', 'Regalo', 'Otros']
const COLORS_PIE = ['#7c6af7', '#34d399', '#f472b6', '#f59e0b', '#3b82f6', '#f87171', '#a78bfa', '#6ee7b7', '#fb923c']

export default function Finanzas() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [viewMonth, setViewMonth] = useState(dayjs())
  const [filterType, setFilterType] = useState('todos')

  // Form
  const [type, setType] = useState('gasto')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Comida')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => { if (user) fetchTransactions() }, [user])

  async function fetchTransactions() {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  async function addTransaction() {
    if (!amount || isNaN(parseFloat(amount))) return
    const { data } = await supabase.from('transactions').insert({
      user_id: user.id,
      type,
      amount: parseFloat(amount),
      category,
      description: desc,
      date,
    }).select().single()
    if (data) setTransactions(prev => [data, ...prev])
    setAmount(''); setDesc(''); setShowModal(false)
  }

  async function deleteTransaction(id) {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  // Filtrar por mes actual seleccionado
  const monthTxs = transactions.filter(t => t.date?.startsWith(viewMonth.format('YYYY-MM')))
  const filtered = filterType === 'todos' ? monthTxs : monthTxs.filter(t => t.type === filterType)

  const totalIngresos = monthTxs.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const totalGastos = monthTxs.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const balance = totalIngresos - totalGastos

  // Gastos por categoría para el pie
  const gastosPorCat = CATEGORIAS_GASTO.map(cat => ({
    name: cat,
    value: monthTxs.filter(t => t.type === 'gasto' && t.category === cat).reduce((s, t) => s + t.amount, 0)
  })).filter(c => c.value > 0)

  // Últimos 6 meses para el bar chart
  const barData = Array.from({ length: 6 }).map((_, i) => {
    const m = dayjs().subtract(5 - i, 'month')
    const key = m.format('YYYY-MM')
    const txs = transactions.filter(t => t.date?.startsWith(key))
    return {
      mes: m.format('MMM'),
      Ingresos: txs.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0),
      Gastos: txs.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0),
    }
  })

  const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>Finanzas</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Registrar
        </button>
      </div>

      {/* Resumen cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Ingresos', value: totalIngresos, icon: TrendingUp, color: '#34d399' },
          { label: 'Gastos', value: totalGastos, icon: TrendingDown, color: '#f87171' },
          { label: 'Balance', value: balance, icon: DollarSign, color: balance >= 0 ? '#34d399' : '#f87171' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color, marginTop: 2 }}>{fmt(value)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Bar chart */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={12}>
              <XAxis dataKey="mes" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                formatter={(v) => fmt(v)}
              />
              <Bar dataKey="Ingresos" fill="#34d399" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Gastos" fill="#f87171" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie gastos por categoría */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Gastos por categoría</h3>
          {gastosPorCat.length === 0
            ? <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, paddingTop: 40 }}>Sin gastos este mes</div>
            : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PieChart width={120} height={120}>
                  <Pie data={gastosPorCat} cx={55} cy={55} innerRadius={32} outerRadius={55} dataKey="value" paddingAngle={3}>
                    {gastosPorCat.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                  </Pie>
                </PieChart>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {gastosPorCat.slice(0, 5).map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS_PIE[i % COLORS_PIE.length] }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>
      </div>

      {/* Filtros y lista */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--bg-secondary)', borderRadius: 10, padding: 3 }}>
            {['todos', 'ingreso', 'gasto'].map(f => (
              <button key={f} onClick={() => setFilterType(f)} style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, fontFamily: 'Outfit, sans-serif',
                background: filterType === f ? 'var(--accent)' : 'transparent',
                color: filterType === f ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}>{f === 'todos' ? 'Todos' : f === 'ingreso' ? 'Ingresos' : 'Gastos'}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setViewMonth(m => m.subtract(1, 'month'))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 }}>‹</button>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, textTransform: 'capitalize', minWidth: 90, textAlign: 'center' }}>
              {viewMonth.format('MMM YYYY')}
            </span>
            <button onClick={() => setViewMonth(m => m.add(1, 'month'))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1 }}>›</button>
          </div>
        </div>

        {filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 13 }}>Sin movimientos este mes</div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map(t => (
                <div key={t.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: t.type === 'ingreso' ? '#34d39920' : '#f8717120',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {t.type === 'ingreso' ? '💰' : '💸'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {t.description || t.category}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {t.category} · {dayjs(t.date).format('D MMM')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontSize: 15, fontWeight: 700,
                      color: t.type === 'ingreso' ? '#34d399' : '#f87171',
                    }}>
                      {t.type === 'ingreso' ? '+' : '-'}{fmt(t.amount)}
                    </span>
                    <button onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={() => setShowModal(false)}>
          <div className="animate-fade-in card" style={{ width: '100%', maxWidth: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Registrar movimiento</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>

            {/* Tipo */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {['gasto', 'ingreso'].map(t => (
                <button key={t} onClick={() => { setType(t); setCategory(t === 'gasto' ? 'Comida' : 'Sueldo') }} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', fontSize: 14, fontWeight: 500,
                  background: type === t ? (t === 'gasto' ? '#f8717130' : '#34d39930') : 'var(--bg-secondary)',
                  color: type === t ? (t === 'gasto' ? '#f87171' : '#34d399') : 'var(--text-secondary)',
                  border: type === t ? `1px solid ${t === 'gasto' ? '#f87171' : '#34d399'}` : '1px solid var(--border)',
                  transition: 'all 0.15s', textTransform: 'capitalize',
                }}>{t === 'gasto' ? '💸 Gasto' : '💰 Ingreso'}</button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Monto (ARS) *</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Categoría</label>
                <select value={category} onChange={e => setCategory(e.target.value)}>
                  {(type === 'gasto' ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Descripción (opcional)</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej: Almuerzo, Uber..." />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={addTransaction} style={{ marginTop: 4 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
