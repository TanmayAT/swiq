'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Store, ShoppingBag, Users, IndianRupee, ToggleLeft, ToggleRight, LogOut, Search, Phone, Calendar, TrendingUp, Lock, KeyRound, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';

const GREEN = '#16a34a';
const DARK  = '#0f2817';

interface Vendor {
  id: string; phone: string; ownerName: string; shopName: string;
  shopId: string; loginToken?: string;
  isActive: boolean; createdAt: string; lastLogin: string;
}

interface Order {
  id: string; customerName: string; customerPhone: string;
  items: { name: string; qty: number; price: number }[];
  total: number; status: string; createdAt: string;
  source?: string;
}

interface Admin { name: string; phone: string; }

const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

function AdminPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [admin,   setAdmin]   = useState<Admin | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [tab,     setTab]     = useState<'overview' | 'vendors' | 'orders'>('overview');
  const [search,  setSearch]  = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast,   setToast]   = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [regenConfirmId, setRegenConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      // 1. Check URL param ?token=
      const urlToken = params.get('token');
      const stored   = typeof window !== 'undefined' ? localStorage.getItem('swiq_admin') : null;

      if (urlToken) {
        const r = await fetch('/api/auth/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: urlToken }) });
        if (r.ok) {
          const data = await r.json();
          const ad: Admin = { name: data.name, phone: data.phone };
          localStorage.setItem('swiq_admin', JSON.stringify({ ...ad, token: urlToken }));
          setAdmin(ad);
          // Strip token from URL
          window.history.replaceState({}, '', '/admin');
          load();
          return;
        }
        setAuthError('Invalid admin token');
        return;
      }

      if (stored) {
        try {
          const s = JSON.parse(stored);
          if (s.token) {
            const r = await fetch('/api/auth/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: s.token }) });
            if (r.ok) {
              setAdmin({ name: s.name, phone: s.phone });
              load();
              return;
            }
          }
        } catch {}
        localStorage.removeItem('swiq_admin');
      }
      setAuthError('Access requires a valid admin token');
    };
    verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    fetch('/api/vendors').then(r => r.json()).then(setVendors);
    fetch('/api/orders').then(r => r.json()).then(setOrders);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const toggleVendor = async (v: Vendor) => {
    await fetch('/api/vendors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: v.id, isActive: !v.isActive }) });
    setConfirmId(null);
    load();
    showToast(`${v.shopName} ${!v.isActive ? 'activated' : 'deactivated'}`);
  };

  const toggleReveal = (id: string) => {
    setRevealedTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      showToast('Token copied to clipboard');
    } catch {
      showToast('Could not copy — copy manually');
    }
  };

  const regenerateToken = async (v: Vendor) => {
    const res = await fetch('/api/vendors/regenerate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: v.id }),
    });
    setRegenConfirmId(null);
    if (!res.ok) { showToast('Failed to regenerate token'); return; }
    setRevealedTokens(prev => ({ ...prev, [v.id]: true })); // auto-reveal on regen
    load();
    showToast(`New token issued for ${v.shopName}`);
  };

  const maskToken = (t?: string) => {
    if (!t) return '— not set —';
    // Show first prefix + last 4, mask the middle.
    if (t.length <= 8) return '•'.repeat(t.length);
    const prefix = t.slice(0, 4);
    const suffix = t.slice(-4);
    return `${prefix}-••••-••••-${suffix}`;
  };

  const logout = () => { localStorage.removeItem('swiq_admin'); router.push('/'); };

  // KPIs
  const totalRevenue   = orders.reduce((s, o) => s + o.total, 0);
  const todayOrders    = orders.filter(o => o.createdAt.startsWith(new Date().toISOString().slice(0,10))).length;
  const activeVendors  = vendors.filter(v => v.isActive).length;
  const customerOrders = orders.filter(o => o.source === 'customer').length;

  const filteredVendors = vendors.filter(v =>
    !search || v.shopName.toLowerCase().includes(search.toLowerCase())
            || v.ownerName.toLowerCase().includes(search.toLowerCase())
            || v.phone.includes(search));

  const filteredOrders = orders.filter(o =>
    !search || o.customerName.toLowerCase().includes(search.toLowerCase())
            || o.customerPhone.includes(search));

  if (authError) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1f12', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid #fee2e2' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <Lock size={28} color="#dc2626" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: DARK, marginBottom: 8 }}>Admin Access Required</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>{authError}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', background: '#f9fafb', padding: '12px 14px', borderRadius: 8, fontFamily: 'monospace', textAlign: 'left' }}>
          Access via: <strong style={{ color: GREEN }}>/admin?token=YOUR_TOKEN</strong>
        </div>
      </div>
    </div>
  );

  if (!admin) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9ca3af' }}>
      Verifying access…
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0fdf4' }}>
      <style>{`
        .adm-hdr   { padding: 14px 28px; }
        .adm-body  { padding: 24px 28px; }
        .adm-kpi   { grid-template-columns: repeat(4, 1fr); }
        .adm-row   { grid-template-columns: 1fr 1fr; }
        .adm-tabs  { flex-direction: row; align-items: center; }
        .adm-search { width: 260px; }
        .adm-tbl   { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .adm-name  { display: inline; }
        @media (max-width: 880px) {
          .adm-hdr  { padding: 12px 14px !important; }
          .adm-body { padding: 14px 12px !important; }
          .adm-kpi  { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .adm-row  { grid-template-columns: 1fr !important; }
          .adm-tabs { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .adm-search { width: 100% !important; }
          .adm-kpi-card { padding: 14px 14px !important; }
          .adm-kpi-val  { font-size: 18px !important; }
          .adm-name { display: none; }
        }
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 300, background: '#fff', border: '1px solid #a7f3d0', borderRadius: 10, padding: '12px 20px', color: GREEN, fontWeight: 700, fontSize: 13, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} /> {toast}
        </div>
      )}

      {/* Header */}
      <header className="adm-hdr" style={{ background: DARK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(22,163,74,0.25)', border: '1px solid rgba(22,163,74,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={17} color="#a7f3d0" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.4 }}>Swiq Admin</div>
            <div style={{ fontSize: 10, color: '#a7f3d0' }}>Super Admin Console</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="adm-name" style={{ fontSize: 12, color: '#a7f3d0' }}>{admin.name} · +91 {admin.phone}</span>
          <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(220,38,38,0.2)', color: '#fca5a5', border: '1px solid rgba(220,38,38,0.4)', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      <div className="adm-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI row */}
        <div className="adm-kpi" style={{ display: 'grid', gap: 14 }}>
          {[
            { label: 'Total Vendors',     value: vendors.length,   icon: Store,      color: '#2563eb', bg: '#dbeafe', sub: `${activeVendors} active` },
            { label: 'Total Orders',      value: orders.length,    icon: ShoppingBag, color: GREEN,    bg: '#dcfce7', sub: `${todayOrders} today` },
            { label: 'Customer Orders',   value: customerOrders,   icon: Users,      color: '#7c3aed', bg: '#ede9fe', sub: `${Math.round(customerOrders / Math.max(orders.length, 1) * 100)}% of total` },
            { label: 'Platform Revenue',  value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: '#ea580c', bg: '#ffedd5', sub: 'all time' },
          ].map(k => (
            <div key={k.label} className="adm-kpi-card" style={{ ...CARD, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>{k.label}</div>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <k.icon size={16} color={k.color} />
                </div>
              </div>
              <div className="adm-kpi-val" style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: -0.6 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="adm-tabs" style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['overview', 'vendors', 'orders'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '9px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: tab === t ? GREEN : '#fff',
                color: tab === t ? '#fff' : '#374151',
                border: tab === t ? 'none' : '1px solid #d1fae5',
                cursor: 'pointer',
                textTransform: 'capitalize',
                boxShadow: tab === t ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
              }}>{t}</button>
            ))}
          </div>
          {(tab === 'vendors' || tab === 'orders') && (
            <div className="adm-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #d1fae5', borderRadius: 8, padding: '7px 14px' }}>
              <Search size={13} color="#9ca3af" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab}…`} style={{ background: 'none', border: 'none', color: DARK, fontSize: 12, width: '100%', outline: 'none' }} />
            </div>
          )}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="adm-row" style={{ display: 'grid', gap: 16 }}>
            <div style={{ ...CARD, padding: '18px 22px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: DARK, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={14} color={GREEN} /> Top Vendors
              </div>
              {vendors.slice(0, 5).map(v => {
                const vOrders = orders.length; // single shop in demo
                return (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: v.isActive ? '#dcfce7' : '#fee2e2', color: v.isActive ? GREEN : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                        {v.shopName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{v.shopName}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{v.ownerName}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: DARK }}>{v.id === 'v1' ? vOrders : 0}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>orders</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ ...CARD, padding: '18px 22px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: DARK, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingBag size={14} color={GREEN} /> Recent Orders
              </div>
              {orders.slice(0, 5).map(o => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{o.customerName}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>#{o.id.slice(-6).toUpperCase()} · {o.items.length} items</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: GREEN }}>₹{o.total}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendors tab */}
        {tab === 'vendors' && (
          <div style={CARD}>
            <div className="adm-tbl">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
              <thead>
                <tr>
                  {['Vendor', 'Phone', 'Login Token', 'Last Login', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, background: '#f0fdf4', borderBottom: '1px solid #d1fae5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((v, idx) => (
                  <tr key={v.id} style={{ background: idx % 2 ? '#fafffe' : '#fff' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: v.isActive ? '#dcfce7' : '#fee2e2', color: v.isActive ? GREEN : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                          {v.shopName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{v.shopName}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{v.ownerName} · {v.shopId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: '#374151' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} color="#9ca3af" /> {v.phone}</div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: v.loginToken ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${v.loginToken ? '#a7f3d0' : '#fecaca'}`,
                          borderRadius: 7, padding: '5px 10px',
                          fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                          color: v.loginToken ? DARK : '#dc2626',
                          maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          <KeyRound size={11} color={v.loginToken ? GREEN : '#dc2626'} />
                          {revealedTokens[v.id] && v.loginToken ? v.loginToken : maskToken(v.loginToken)}
                        </div>
                        {v.loginToken && (
                          <>
                            <button onClick={() => toggleReveal(v.id)} title={revealedTokens[v.id] ? 'Hide' : 'Reveal'} style={{
                              background: '#fff', border: '1px solid #d1fae5', borderRadius: 6,
                              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#374151',
                            }}>
                              {revealedTokens[v.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button onClick={() => copyToken(v.loginToken!)} title="Copy" style={{
                              background: '#fff', border: '1px solid #d1fae5', borderRadius: 6,
                              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#374151',
                            }}>
                              <Copy size={12} />
                            </button>
                          </>
                        )}
                        {regenConfirmId === v.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button onClick={() => regenerateToken(v)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Confirm</button>
                            <button onClick={() => setRegenConfirmId(null)} style={{ background: '#fff', color: '#9ca3af', border: '1px solid #d1fae5', borderRadius: 6, padding: '5px 8px', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setRegenConfirmId(v.id)} title="Regenerate token" style={{
                            background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6,
                            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#ea580c',
                          }}>
                            <RefreshCw size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: '#9ca3af' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> {new Date(v.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 5,
                        background: v.isActive ? '#dcfce7' : '#fee2e2',
                        color: v.isActive ? GREEN : '#dc2626',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>{v.isActive ? 'Active' : 'Suspended'}</span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {confirmId === v.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Confirm?</span>
                          <button onClick={() => toggleVendor(v)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Yes</button>
                          <button onClick={() => setConfirmId(null)} style={{ background: '#fff', color: '#9ca3af', border: '1px solid #d1fae5', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(v.id)} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: v.isActive ? '#fef2f2' : '#f0fdf4',
                          color: v.isActive ? '#dc2626' : GREEN,
                          border: `1px solid ${v.isActive ? '#fecaca' : '#a7f3d0'}`,
                          borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}>
                          {v.isActive ? <><ToggleRight size={14} /> Deactivate</> : <><ToggleLeft size={14} /> Activate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredVendors.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48, fontSize: 13, color: '#9ca3af' }}>No vendors found</td></tr>
                )}
                {/* colSpan unchanged: we replaced "Joined" column with "Login Token" so still 6 columns */}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div style={CARD}>
            <div className="adm-tbl">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  {['#', 'Customer', 'Phone', 'Items', 'Total', 'Source', 'Status', 'Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, background: '#f0fdf4', borderBottom: '1px solid #d1fae5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 50).map((o, idx) => (
                  <tr key={o.id} style={{ background: idx % 2 ? '#fafffe' : '#fff' }}>
                    <td style={{ padding: '11px 18px', fontSize: 11, color: '#9ca3af', fontWeight: 700 }}>#{o.id.slice(-4).toUpperCase()}</td>
                    <td style={{ padding: '11px 18px', fontSize: 13, fontWeight: 700, color: DARK }}>{o.customerName}</td>
                    <td style={{ padding: '11px 18px', fontSize: 12, color: '#374151' }}>{o.customerPhone}</td>
                    <td style={{ padding: '11px 18px', fontSize: 12, color: '#374151' }}>{o.items.length} items</td>
                    <td style={{ padding: '11px 18px', fontSize: 13, fontWeight: 800, color: GREEN }}>₹{o.total}</td>
                    <td style={{ padding: '11px 18px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: o.source === 'customer' ? '#dbeafe' : '#f3f4f6', color: o.source === 'customer' ? '#2563eb' : '#6b7280' }}>
                        {o.source === 'customer' ? 'Online' : 'POS'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 18px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                        background: o.status === 'completed' ? '#dcfce7' : o.status === 'in-progress' ? '#dbeafe' : '#fef9c3',
                        color: o.status === 'completed' ? GREEN : o.status === 'in-progress' ? '#2563eb' : '#ca8a04',
                      }}>{o.status}</span>
                    </td>
                    <td style={{ padding: '11px 18px', fontSize: 11, color: '#9ca3af' }}>
                      {new Date(o.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, fontSize: 13, color: '#9ca3af' }}>No orders found</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Wrap in Suspense — required by Next.js when a client component uses
 * `useSearchParams()` and the page is statically prerendered (e.g. by
 * Cloudflare's OpenNext build, which fails on the CSR bailout otherwise).
 */
export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9ca3af' }}>
          Loading admin…
        </div>
      }
    >
      <AdminPageInner />
    </Suspense>
  );
}
