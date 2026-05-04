'use client';
import { useEffect, useState } from 'react';
import { Search, Bell, TrendingUp, Users, Crown, RotateCcw, Phone, Calendar } from 'lucide-react';
import { Customer } from '@/lib/types';

const TAG: Record<string, { label: string; color: string; bg: string }> = {
  vip:    { label: 'VIP',    color: '#7c3aed', bg: '#ede9fe' },
  loyal:  { label: 'Loyal',  color: '#ea580c', bg: '#ffedd5' },
  repeat: { label: 'Repeat', color: '#2563eb', bg: '#dbeafe' },
  new:    { label: 'New',    color: '#16a34a', bg: '#dcfce7' },
};

function getTag(c: Customer) {
  if (c.visitCount >= 10) return TAG.vip;
  if (c.visitCount >= 5)  return TAG.loyal;
  if (c.isRepeat)         return TAG.repeat;
  return TAG.new;
}

const CARD: React.CSSProperties = { background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const TH: React.CSSProperties   = { textAlign: 'left', padding: '10px 18px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, background: '#f0fdf4', borderBottom: '1px solid #d1fae5', whiteSpace: 'nowrap' };
const TD: React.CSSProperties   = { padding: '12px 18px', fontSize: 12, color: '#374151', borderBottom: '1px solid #d1fae5', verticalAlign: 'middle' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'all' | 'repeat' | 'new'>('all');
  const [sending,   setSending]   = useState<string | null>(null);
  const [toast,     setToast]     = useState('');

  const load = () => fetch('/api/customers').then(r => r.json()).then(setCustomers);
  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const sendNotif = async (c: Customer) => {
    setSending(c.id);
    const type = c.visitCount >= 10 ? 'vip' : c.visitCount >= 5 ? 'loyalty' : 'repeat_customer';
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: c.id, customerName: c.name, customerPhone: c.phone, type }) });
    setSending(null); showToast(`Notification sent to ${c.name.split(' ')[0]} ✓`); load();
  };

  const filtered = customers
    .filter(c => filter === 'all' || (filter === 'repeat' ? c.isRepeat : !c.isRepeat))
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    .sort((a, b) => b.visitCount - a.visitCount);

  const kpis = [
    { label: 'Total Customers',   value: customers.length,                                        icon: Users,      color: '#2563eb', bg: '#dbeafe' },
    { label: 'Repeat Customers',  value: customers.filter(c => c.isRepeat).length,                icon: RotateCcw,  color: '#ea580c', bg: '#ffedd5' },
    { label: 'VIP Customers',     value: customers.filter(c => c.visitCount >= 10).length,        icon: Crown,      color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Customer Revenue',  value: `₹${customers.reduce((s,c)=>s+c.totalSpent,0).toLocaleString('en-IN')}`, icon: TrendingUp, color: '#16a34a', bg: '#dcfce7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .cust-kpi    { grid-template-columns: repeat(4, 1fr); }
        .cust-tool   { flex-direction: row; align-items: center; }
        .cust-search { width: 220px; }
        .cust-tbl    { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        @media (max-width: 880px) {
          .cust-kpi    { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .cust-tool   { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .cust-search { width: 100% !important; }
          .cust-kpi-card { padding: 14px 14px !important; }
          .cust-kpi-val  { font-size: 18px !important; }
        }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 300,
          background: '#fff', border: '1px solid #a7f3d0',
          borderRadius: 10, padding: '12px 20px',
          color: '#16a34a', fontWeight: 700, fontSize: 13,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
          {toast}
        </div>
      )}

      {/* KPI row */}
      <div className="cust-kpi" style={{ display: 'grid', gap: 14 }}>
        {kpis.map(k => (
          <div key={k.label} className="cust-kpi-card" style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>{k.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <k.icon size={16} color={k.color} />
              </div>
            </div>
            <div className="cust-kpi-val" style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: -0.6 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="cust-tool" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all','repeat','new'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              background: filter === f ? '#16a34a' : '#ffffff',
              color: filter === f ? '#fff' : '#9ca3af',
              border: `1px solid ${filter === f ? '#16a34a' : '#d1fae5'}`,
              cursor: 'pointer',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="cust-search" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 8, padding: '7px 14px' }}>
          <Search size={13} color="#9ca3af" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers…"
            style={{ background: 'none', border: 'none', color: '#0f2817', fontSize: 12, width: '100%', outline: 'none' }} />
        </div>
      </div>

      {/* Table */}
      <div style={CARD}>
        <div className="cust-tbl">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>{['Customer', 'Phone', 'Visits', 'Spent', 'Last Visit', 'Tag', 'Notify'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => {
              const tag = getTag(c);
              return (
                <tr key={c.id} style={{ background: idx % 2 ? '#fafffe' : '#fff' }}>
                  <td style={{ ...TD, fontWeight: 700, color: '#0f2817' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: tag.bg, border: `1.5px solid ${tag.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: tag.color, flexShrink: 0 }}>
                        {c.name.charAt(0)}
                      </div>
                      {c.name}
                    </div>
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Phone size={11} color="var(--text3)" /> {c.phone}
                    </div>
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: tag.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: tag.color }}>
                        {c.visitCount}
                      </div>
                      <div style={{ width: 50, height: 5, background: '#d1fae5', borderRadius: 3 }}>
                        <div style={{ height: '100%', background: tag.color, borderRadius: 3, width: `${Math.min(100, (c.visitCount / 12) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ ...TD, fontWeight: 800, color: '#0f2817', fontSize: 13 }}>₹{c.totalSpent.toLocaleString('en-IN')}</td>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={11} color="var(--text3)" />
                      {new Date(c.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </td>
                  <td style={TD}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: tag.bg, color: tag.color }}>{tag.label}</span>
                  </td>
                  <td style={TD}>
                    {c.isRepeat ? (
                      <button onClick={() => !c.notified && sendNotif(c)} disabled={c.notified || !!sending} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 6,
                        background: c.notified ? '#dcfce7' : '#dbeafe',
                        color: c.notified ? '#16a34a' : '#2563eb',
                        border: `1px solid ${c.notified ? '#bbf7d0' : '#bfdbfe'}`,
                        cursor: c.notified ? 'default' : 'pointer',
                      }}>
                        <Bell size={11} />
                        {c.notified ? 'Sent ✓' : sending === c.id ? '…' : 'Send'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af' }}>No customers found</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
