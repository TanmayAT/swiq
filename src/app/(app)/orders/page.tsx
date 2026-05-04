'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, X, Clock } from 'lucide-react';
import { Order, Product } from '@/lib/types';

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:      { label: 'Pending',     color: '#ca8a04', bg: '#fef9c3' },
  'in-progress':{ label: 'In Progress', color: '#2563eb', bg: '#dbeafe' },
  completed:    { label: 'Completed',   color: '#16a34a', bg: '#dcfce7' },
};

const CARD: React.CSSProperties = { background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const TH: React.CSSProperties   = { textAlign: 'left', padding: '10px 18px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, background: '#f0fdf4', borderBottom: '1px solid #d1fae5', whiteSpace: 'nowrap' };
const TD: React.CSSProperties   = { padding: '11px 18px', fontSize: 12, color: '#374151', borderBottom: '1px solid #d1fae5', verticalAlign: 'middle' };

interface CartItem { name: string; qty: number; price: number; }

export default function OrdersPage() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter,   setFilter]   = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [search,   setSearch]   = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const [cart,     setCart]     = useState<CartItem[]>([]);
  const [custName, setCustName] = useState('');
  const [custPhone,setCustPhone]= useState('');
  const [saving,   setSaving]   = useState(false);

  const load = () => fetch('/api/orders').then(r => r.json()).then(setOrders);
  useEffect(() => { load(); fetch('/api/products').then(r => r.json()).then(setProducts); }, []);

  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => !search || o.customerName.toLowerCase().includes(search.toLowerCase()) || o.customerPhone.includes(search))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    load();
  };

  const markPaid = async (id: string) => {
    await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, paymentStatus: 'paid' }) });
    load();
  };

  const addToCart = (p: Product) => setCart(prev => {
    const idx = prev.findIndex(i => i.name === p.name);
    if (idx !== -1) return prev.map((it, j) => j === idx ? { ...it, qty: it.qty + 1 } : it);
    return [...prev, { name: p.name, qty: 1, price: p.price }];
  });

  const submitOrder = async () => {
    if (!custName || !custPhone || !cart.length) return;
    setSaving(true);
    await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: custName, customerPhone: custPhone, items: cart }) });
    setSaving(false); setShowNew(false); setCart([]); setCustName(''); setCustPhone(''); load();
  };

  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const counts = { all: orders.length, pending: orders.filter(o=>o.status==='pending').length, 'in-progress': orders.filter(o=>o.status==='in-progress').length, completed: orders.filter(o=>o.status==='completed').length };
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .ord-toolbar { flex-direction: row; align-items: center; }
        .ord-search  { width: 220px; }
        .ord-tbl     { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        @media (max-width: 880px) {
          .ord-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .ord-toolbar > div { flex-wrap: wrap; }
          .ord-search  { width: 100% !important; flex: 1; }
          .ord-newbtn  { padding: 9px 14px !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="ord-toolbar" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all','pending','in-progress','completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              background: filter === f ? '#16a34a' : '#ffffff',
              color: filter === f ? '#fff' : '#9ca3af',
              border: `1px solid ${filter === f ? '#16a34a' : '#d1fae5'}`,
              cursor: 'pointer',
            }}>
              {f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="ord-search" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#ffffff', border: '1px solid #d1fae5',
            borderRadius: 8, padding: '7px 14px',
          }}>
            <Search size={13} color="#9ca3af" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders…"
              style={{ background: 'none', border: 'none', color: '#0f2817', fontSize: 12, width: '100%', outline: 'none' }} />
          </div>
          <button onClick={() => setShowNew(true)} className="ord-newbtn" style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#16a34a', color: '#fff',
            padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)', whiteSpace: 'nowrap',
          }}>
            <Plus size={15} /> New Order
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={CARD}>
        <div className="ord-tbl">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>{['#', 'Customer', 'Phone', 'Items', 'Total', 'Time', 'Status', 'Action'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((order, idx) => {
              const sm = STATUS[order.status] || STATUS.pending;
              return (
                <tr key={order.id} style={{ background: idx % 2 ? '#fafffe' : '#fff' }}>
                  <td style={{ ...TD, fontWeight: 700, color: '#9ca3af', fontSize: 11 }}>#{order.id.slice(-4).toUpperCase()}</td>
                  <td style={{ ...TD, fontWeight: 700, color: '#0f2817' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {order.customerName}
                      {order.source === 'customer' && (
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#dbeafe', color: '#2563eb', letterSpacing: 0.4 }}>ONLINE</span>
                      )}
                    </div>
                    {order.note && (
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, fontStyle: 'italic' }} title={order.note}>"{order.note}"</div>
                    )}
                  </td>
                  <td style={TD}>{order.customerPhone}</td>
                  <td style={TD}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {order.items.map((it, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 4,
                          background: '#dcfce7', color: '#16a34a',
                          fontWeight: 600,
                        }}>{it.qty}× {it.name}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ ...TD, fontWeight: 800, color: '#0f2817', fontSize: 13 }}>
                    ₹{order.total}
                    {order.paymentMethod && (
                      <div style={{ marginTop: 3, display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          background: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3',
                          color: order.paymentStatus === 'paid' ? '#16a34a' : '#ca8a04',
                          letterSpacing: 0.3,
                        }}>
                          {order.paymentMethod === 'upi'
                            ? (order.paymentStatus === 'paid' ? 'UPI ✓' : 'UPI Pending')
                            : 'Cash'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color="var(--text3)" />
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={TD}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: sm.bg, color: sm.color }}>{sm.label}</span>
                  </td>
                  <td style={TD}>
                    {order.status === 'pending' && (
                      <button onClick={() => updateStatus(order.id, 'in-progress')} style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
                        background: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer',
                      }}>Start</button>
                    )}
                    {order.status === 'in-progress' && (
                      <button onClick={() => updateStatus(order.id, 'completed')} style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
                        background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer',
                      }}>Complete</button>
                    )}
                    {order.status === 'completed' && <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>}
                    {order.paymentStatus === 'pending' && order.paymentMethod && (
                      <button onClick={() => markPaid(order.id)} title="Mark payment received" style={{
                        marginLeft: 6, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                        background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer',
                      }}>₹ Paid</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af' }}>No orders found</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* New Order Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #a7f3d0', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #d1fae5' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f2817' }}>New Order</div>
              <button onClick={() => { setShowNew(false); setCart([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[{ val: custName, set: setCustName, ph: 'Customer Name' }, { val: custPhone, set: setCustPhone, ph: 'Phone Number' }].map((f, i) => (
                  <input key={i} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={{ background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 8, padding: '10px 14px', color: '#0f2817', fontSize: 13 }} />
                ))}
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Select Items</div>
              {categories.map(cat => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8, fontWeight: 600 }}>{cat}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
                    {products.filter(p => p.category === cat).map(p => {
                      const inCart = cart.find(i => i.name === p.name);
                      return (
                        <button key={p.id} onClick={() => addToCart(p)} style={{
                          background: inCart ? '#dcfce7' : 'var(--bg)',
                          border: inCart ? '1px solid #16a34a' : '1px solid #d1fae5',
                          borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: inCart ? '#16a34a' : '#0f2817' }}>{p.name}</div>
                            {inCart && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>×{inCart.qty} added</div>}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: inCart ? '#16a34a' : '#9ca3af' }}>₹{p.price}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {cart.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 10, padding: '14px 16px', marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Cart</div>
                  {cart.map(item => (
                    <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#374151' }}>{item.qty}× {item.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2817' }}>₹{item.qty * item.price}</span>
                        <button onClick={() => setCart(c => c.filter(i => i.name !== item.name))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={12} /></button>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #d1fae5', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <span style={{ fontSize: 13, color: '#0f2817' }}>Total</span>
                    <span style={{ fontSize: 16, color: '#16a34a' }}>₹{cartTotal}</span>
                  </div>
                </div>
              )}

              <button onClick={submitOrder} disabled={!custName || !custPhone || !cart.length || saving} style={{
                width: '100%', marginTop: 16, padding: '13px',
                borderRadius: 9, border: 'none',
                background: (!custName || !custPhone || !cart.length) ? '#e5e7eb' : '#16a34a',
                color: (!custName || !custPhone || !cart.length) ? '#9ca3af' : '#fff',
                fontWeight: 800, fontSize: 14, cursor: (!custName || !custPhone || !cart.length) ? 'not-allowed' : 'pointer',
                boxShadow: (custName && custPhone && cart.length) ? '0 4px 14px rgba(22,163,74,0.35)' : 'none',
              }}>
                {saving ? 'Placing…' : `Place Order${cart.length ? ` · ₹${cartTotal}` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
