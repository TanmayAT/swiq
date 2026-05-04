'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Clock, CheckCircle2, ChefHat, Package, RefreshCw, LogOut, ShoppingBag } from 'lucide-react';

interface OrderItem { name: string; qty: number; price: number; }
interface Order {
  id: string; customerName: string; customerPhone: string;
  items: OrderItem[]; total: number;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string; note?: string;
  paymentStatus?: 'pending' | 'paid';
  paymentMethod?: 'upi' | 'cash';
}

const GREEN = '#16a34a';
const DARK  = '#0f2817';

const STAGES = [
  { key: 'pending',     label: 'Order Received', icon: Package,      color: '#ca8a04', bg: '#fef9c3' },
  { key: 'in-progress', label: 'Preparing',      icon: ChefHat,      color: '#2563eb', bg: '#dbeafe' },
  { key: 'completed',   label: 'Ready / Done',   icon: CheckCircle2, color: '#16a34a', bg: '#dcfce7' },
];

export default function MyOrdersPage() {
  const router = useRouter();
  const [user,   setUser]   = useState<{ phone: string; name: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('swiq_customer') : null;
    if (!raw) { router.push('/shop/login'); return; }
    const u = JSON.parse(raw);
    setUser(u);
    load(u.phone);
    const t = setInterval(() => load(u.phone, true), 8000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (phone: string, silent = false) => {
    if (!silent) setLoading(true);
    const r = await fetch(`/api/orders?phone=${phone}`);
    const data = await r.json();
    setOrders(data);
    setLoading(false);
  };

  const refresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await load(user.phone);
    setRefreshing(false);
  };

  const logout = () => {
    localStorage.removeItem('swiq_customer');
    router.push('/shop/login');
  };

  const stageIdx = (s: string) => STAGES.findIndex(x => x.key === s);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/shop" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex' }}><ChevronLeft size={22} color="#374151" /></Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>My Orders</div>
          {user && <div style={{ fontSize: 11, color: '#9ca3af' }}>{user.name} · {user.phone}</div>}
        </div>
        <button onClick={refresh} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
          <RefreshCw size={17} color="#374151" style={{ transform: refreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s' }} />
        </button>
        <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
          <LogOut size={17} color="#9ca3af" />
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', fontSize: 13, color: '#9ca3af' }}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
          <ShoppingBag size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>No orders yet</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Start ordering from your favourite shop</div>
          <Link href="/shop" style={{ background: GREEN, color: '#fff', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', textDecoration: 'none', display: 'inline-block' }}>
            Browse Menu
          </Link>
        </div>
      ) : (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map(order => {
            const sIdx = stageIdx(order.status);
            const stage = STAGES[sIdx >= 0 ? sIdx : 0];
            const isLive = order.status !== 'completed';

            return (
              <div key={order.id} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${isLive ? '#a7f3d0' : '#e5e7eb'}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

                {/* Top bar */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Order #{order.id.slice(-6).toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {new Date(order.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: stage.bg }}>
                    <stage.icon size={12} color={stage.color} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: stage.color }}>{stage.label}</span>
                  </div>
                </div>

                {/* Stage tracker */}
                {isLive && (
                  <div style={{ padding: '20px 18px 8px', background: '#f0fdf4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                      {/* Bg line */}
                      <div style={{ position: 'absolute', top: 14, left: '12%', right: '12%', height: 2, background: '#d1fae5' }} />
                      {/* Progress line */}
                      <div style={{ position: 'absolute', top: 14, left: '12%', height: 2, background: GREEN, width: `${(sIdx / (STAGES.length - 1)) * 76}%`, transition: 'width 0.5s' }} />

                      {STAGES.map((s, i) => {
                        const done = i <= sIdx;
                        return (
                          <div key={s.key} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, zIndex: 1 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: done ? GREEN : '#fff', border: `2px solid ${done ? GREEN : '#d1fae5'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: done && i === sIdx ? '0 0 0 4px rgba(22,163,74,0.18)' : 'none' }}>
                              <s.icon size={13} color={done ? '#fff' : '#9ca3af'} />
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: done ? DARK : '#9ca3af', textAlign: 'center' }}>{s.label}</div>
                          </div>
                        );
                      })}
                    </div>

                    {order.status === 'in-progress' && (
                      <div style={{ marginTop: 16, fontSize: 12, color: GREEN, fontWeight: 600, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s infinite' }} />
                        Your food is being prepared
                      </div>
                    )}
                    {order.status === 'pending' && (
                      <div style={{ marginTop: 16, fontSize: 12, color: '#ca8a04', textAlign: 'center' }}>
                        Waiting for the shop to accept your order
                      </div>
                    )}
                    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
                  </div>
                )}

                {/* Items */}
                <div style={{ padding: '14px 18px' }}>
                  {order.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 6 }}>
                      <span>{it.qty}× {it.name}</span>
                      <span style={{ fontWeight: 600 }}>₹{it.qty * it.price}</span>
                    </div>
                  ))}
                  {order.note && (
                    <div style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic', marginTop: 8, padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
                      Note: {order.note}
                    </div>
                  )}
                  <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: 14 }}>
                    <span>Total</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {order.paymentMethod && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5,
                          background: order.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3',
                          color: order.paymentStatus === 'paid' ? GREEN : '#ca8a04',
                        }}>
                          {order.paymentMethod === 'upi'
                            ? (order.paymentStatus === 'paid' ? 'UPI Paid ✓' : 'UPI Pending')
                            : (order.paymentStatus === 'paid' ? 'Cash Paid ✓' : 'Pay at counter')}
                        </span>
                      )}
                      <span style={{ color: GREEN }}>₹{order.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
