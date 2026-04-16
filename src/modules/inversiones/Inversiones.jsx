import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, X, ExternalLink } from 'lucide-react'

const TIPOS = ['Cripto', 'Acción', 'CEDEAR', 'Plazo Fijo', 'Dólar', 'Otro']

const CRYPTO_IDS = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether', 'BNB': 'binancecoin',
  'SOL': 'solana', 'ADA': 'cardano', 'DOT': 'polkadot', 'MATIC': 'matic-network',
  'USDC': 'usd-coin', 'AVAX': 'avalanche-2', 'XRP': 'ripple', 'DOGE': 'dogecoin',
}

export default function Inversiones() {
  const { user } = useAuth()
  const [holdings, setHoldings] = useState([])
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [dolarBlue, setDolarBlue] = useState(null)

  // Form
  const [tipo, setTipo] = useState('Cripto')
  const [nombre, setNombre] = useState('')
  const [ticker, setTicker] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [moneda, setMoneda] = useState('USD')
  const [vencimiento, setVencimiento] = useState('')
  const [tna, setTna] = useState('')

  useEffect(() => { if (user) { fetchHoldings(); fetchDolar() } }, [user])

  async function fetchHoldings() {
    setLoading(true)
    const { data } = await supabase.from('holdings').select('*').eq('user_id', user.id).order('created_at')
    setHoldings(data || [])
    if (data?.length) await fetchPrices(data)
    setLoading(false)
  }

  async function fetchDolar() {
    try {
      const res = await fetch('https://dolarapi.com/v1/dolares/blue')
      const d = await res.json()
      setDolarBlue(d.venta)
    } catch { setDolarBlue(1300) }
  }

  async function fetchPrices(data) {
    const cryptoHoldings = (data || holdings).filter(h => h.tipo === 'Cripto' && h.ticker)
    if (cryptoHoldings.length === 0) return

    const ids = cryptoHoldings
      .map(h => CRYPTO_IDS[h.ticker?.toUpperCase()])
      .filter(Boolean)
      .join(',')

    if (!ids) return
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
      const d = await res.json()
      const mapped = {}
      cryptoHoldings.forEach(h => {
        const id = CRYPTO_IDS[h.ticker?.toUpperCase()]
        if (id && d[id]) mapped[h.ticker.toUpperCase()] = d[id]
      })
      setPrices(mapped)
    } catch { console.log('Error fetching prices') }
  }

  async function refreshPrices() {
    setRefreshing(true)
    await fetchDolar()
    await fetchPrices(holdings)
    setRefreshing(false)
  }

  async function addHolding() {
    if (!nombre.trim() || !cantidad) return
    const { data } = await supabase.from('holdings').insert({
      user_id: user.id,
      tipo, nombre, ticker: ticker.toUpperCase(),
      cantidad: parseFloat(cantidad),
      precio_compra: precioCompra ? parseFloat(precioCompra) : null,
      moneda,
      vencimiento: vencimiento || null,
      tna: tna ? parseFloat(tna) : null,
    }).select().single()
    if (data) {
      setHoldings(prev => [...prev, data])
      await fetchPrices([...holdings, data])
    }
    setNombre(''); setTicker(''); setCantidad(''); setPrecioCompra(''); setVencimiento(''); setTna('')
    setShowModal(false)
  }

  async function deleteHolding(id) {
    await supabase.from('holdings').delete().eq('id', id)
    setHoldings(prev => prev.filter(h => h.id !== id))
  }

  function getPrecioActual(h) {
    if (h.tipo === 'Cripto' && h.ticker && prices[h.ticker.toUpperCase()]) {
      return prices[h.ticker.toUpperCase()].usd
    }
    if (h.tipo === 'Plazo Fijo') {
      if (h.tna && h.vencimiento && h.precio_compra) {
        const dias = Math.max(0, Math.round((new Date(h.vencimiento) - new Date()) / 86400000))
        const interes = h.precio_compra * (h.tna / 100) * (dias / 365)
        return h.precio_compra + interes
      }
    }
    return null
  }

  function getValorTotal(h) {
    const p = getPrecioActual(h)
    if (p !== null) return p * h.cantidad
    if (h.precio_compra) return h.precio_compra * h.cantidad
    return null
  }

  function getVariacion(h) {
    if (h.tipo === 'Cripto' && h.ticker && prices[h.ticker.toUpperCase()]) {
      return prices[h.ticker.toUpperCase()].usd_24h_change
    }
    return null
  }

  const totalPortfolio = holdings.reduce((sum, h) => {
    const v = getValorTotal(h)
    if (v === null) return sum
    return sum + (h.moneda === 'ARS' ? v / (dolarBlue || 1300) : v)
  }, 0)

  const fmt = (n, cur = 'USD') => {
    if (n === null || n === undefined) return '—'
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: cur === 'ARS' ? 'ARS' : 'USD',
      maximumFractionDigits: cur === 'ARS' ? 0 : 2,
    }).format(n)
  }

  const TIPO_COLORS = {
    'Cripto': '#f59e0b', 'Acción': '#3b82f6', 'CEDEAR': '#7c6af7',
    'Plazo Fijo': '#34d399', 'Dólar': '#10b981', 'Otro': '#8888a8',
  }

  const TIPO_EMOJIS = {
    'Cripto': '₿', 'Acción': '📊', 'CEDEAR': '🇦🇷',
    'Plazo Fijo': '🏦', 'Dólar': '💵', 'Otro': '📦',
  }

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>Inversiones</h1>
          {dolarBlue && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>💵 Dólar blue: ${dolarBlue}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ghost" onClick={refreshPrices} disabled={refreshing} style={{ padding: '10px 14px' }}>
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      {/* Portfolio total */}
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--accent-glow), transparent)', borderColor: 'var(--accent)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Portfolio total (en USD)</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--text-primary)' }}>
          {fmt(totalPortfolio, 'USD')}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
          ≈ {fmt(totalPortfolio * (dolarBlue || 1300), 'ARS')} ARS
        </div>
      </div>

      {/* Distribución por tipo */}
      {holdings.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {TIPOS.filter(t => holdings.some(h => h.tipo === t)).map(t => {
            const total = holdings.filter(h => h.tipo === t).reduce((s, h) => {
              const v = getValorTotal(h)
              return s + (v ? (h.moneda === 'ARS' ? v / (dolarBlue || 1300) : v) : 0)
            }, 0)
            const pct = totalPortfolio > 0 ? (total / totalPortfolio * 100).toFixed(1) : 0
            return (
              <div key={t} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 16 }}>{TIPO_EMOJIS[t]}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{pct}% · {fmt(total)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Holdings */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 13 }}>Cargando...</div>
      ) : holdings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <p style={{ fontSize: 15 }}>Agregá tus primeros activos</p>
          <p style={{ fontSize: 13, marginTop: 6, opacity: 0.7 }}>Cripto, CEDEARs, acciones, plazo fijo y más</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {holdings.map(h => {
            const precioActual = getPrecioActual(h)
            const valorTotal = getValorTotal(h)
            const variacion = getVariacion(h)

            return (
              <div key={h.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0, flex: 1 }}>
                  {/* Ícono */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: TIPO_COLORS[h.tipo] + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                  }}>
                    {TIPO_EMOJIS[h.tipo]}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {h.nombre}
                      {h.ticker && <span style={{ fontSize: 11, color: TIPO_COLORS[h.tipo], background: TIPO_COLORS[h.tipo] + '20', padding: '2px 7px', borderRadius: 99 }}>{h.ticker}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                      {h.cantidad} unidades
                      {h.precio_compra && ` · Compra: ${fmt(h.precio_compra, h.moneda)}`}
                      {h.tipo === 'Plazo Fijo' && h.tna && ` · TNA ${h.tna}%`}
                      {h.vencimiento && ` · Vence ${h.vencimiento}`}
                    </div>
                  </div>
                </div>

                {/* Precio y variación */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {valorTotal !== null && (
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {fmt(valorTotal, h.moneda)}
                    </div>
                  )}
                  {precioActual !== null && h.tipo !== 'Plazo Fijo' && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {fmt(precioActual, h.moneda)} c/u
                    </div>
                  )}
                  {variacion !== null && (
                    <div style={{
                      fontSize: 12, marginTop: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end',
                      color: variacion >= 0 ? '#34d399' : '#f87171',
                    }}>
                      {variacion >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {variacion >= 0 ? '+' : ''}{variacion.toFixed(2)}% 24h
                    </div>
                  )}
                </div>

                <button onClick={() => deleteHolding(h.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
          onClick={() => setShowModal(false)}>
          <div className="animate-fade-in card" style={{ width: '100%', maxWidth: 460, padding: 28, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Agregar activo</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
            </div>

            {/* Tipo */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>Tipo</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {TIPOS.map(t => (
                  <button key={t} onClick={() => setTipo(t)} style={{
                    padding: '7px 14px', borderRadius: 8, border: tipo === t ? `1px solid ${TIPO_COLORS[t]}` : '1px solid var(--border)',
                    background: tipo === t ? TIPO_COLORS[t] + '20' : 'var(--bg-secondary)',
                    color: tipo === t ? TIPO_COLORS[t] : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 13, fontFamily: 'Outfit, sans-serif', fontWeight: 500,
                    transition: 'all 0.15s',
                  }}>{TIPO_EMOJIS[t]} {t}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Nombre *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder={tipo === 'Cripto' ? 'Bitcoin' : tipo === 'Plazo Fijo' ? 'Plazo Fijo Banco X' : 'Nombre del activo'} />
              </div>

              {(tipo === 'Cripto' || tipo === 'Acción' || tipo === 'CEDEAR') && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                    Ticker {tipo === 'Cripto' && <span style={{ opacity: 0.6 }}>(BTC, ETH, SOL...)</span>}
                  </label>
                  <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="BTC" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                    {tipo === 'Dólar' ? 'Cantidad (USD)' : tipo === 'Plazo Fijo' ? 'Capital (ARS)' : 'Cantidad'} *
                  </label>
                  <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0" min="0" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                    {tipo === 'Plazo Fijo' ? 'Capital invertido (ARS)' : 'Precio de compra'}
                  </label>
                  <input type="number" value={precioCompra} onChange={e => setPrecioCompra(e.target.value)} placeholder="0.00" min="0" />
                </div>
              </div>

              {tipo !== 'Cripto' && tipo !== 'Dólar' && (
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Moneda</label>
                  <select value={moneda} onChange={e => setMoneda(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
              )}

              {tipo === 'Plazo Fijo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>TNA (%)</label>
                    <input type="number" value={tna} onChange={e => setTna(e.target.value)} placeholder="118" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Vencimiento</label>
                    <input type="date" value={vencimiento} onChange={e => setVencimiento(e.target.value)} />
                  </div>
                </div>
              )}

              <button className="btn-primary" onClick={addHolding} style={{ marginTop: 4 }}>Agregar activo</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
