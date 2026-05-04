'use client';
import { useEffect, useState } from 'react';
import { Bell, Zap, Users, Star, Crown, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Notification, Customer } from '@/lib/types';

const TYPE: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  repeat_customer: { label: 'Repeat',  icon: RotateCcw, color: '#2563eb', bg: '#dbeafe' },
  loyalty:         { label: 'Loyalty', icon: Star,      color: '#ea580c', bg: '#ffedd5' },
  vip:             { label: 'VIP',     icon: Crown,     color: '#7c3aed', bg: '#ede9fe' },
};

const CARD: React.CSSProperties = { background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const TH: React.CSSProperties   = { textAlign: 'left', padding: '10px 18px', fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6, background: '#f0fdf4', borderBottom: '1px solid #d1fae5' };
const TD: React.CSSProperties   = { padding: '12px 18px', fontSize: 12, color: '#374151', borderBottom: '1px solid #d1fae5', verticalAlign: 'middle' };

export default function NotificationsPage() {
  const [notifs,    setNotifs]    = useState<Notification[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sending,   setSending]   = useState(false);
  const [toast,     setToast]     = useState('');

  const load = () => {
    fetch('/api/notifications').then(r => r.json()).then(setNotifs);
    fetch('/api/customers').then(r => r.json()).then(setCustomers);
  };
  useEffect(() => { load(); }, []);

  const eligible = customers.filter(c => c.isRepeat && !c.notified);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const sendBulk = async () => {
    setSending(true);
    for (const c of eligible) {
      const type = c.visitCount >= 10 ? 'vip' : c.visitCount >= 5 ? 'loyalty' : 'repeat_customer';
      await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: c.id, customerName: c.name, customerPhone: c.phone, type }) });
    }
    setSending(false); showToast(`${eligible.length} notifications sent successfully`); load();
  };

  const todaySent = notifs.filter(n => n.sentAt.startsWith(new Date().toISOString().slice(0, 10))).length;
  const kpis = [
    { label: 'Total Sent',    value: notifs.length,                              icon: Bell,         color: '#2563eb', bg: '#dbeafe' },
    { label: 'Sent Today',    value: todaySent,                                  icon: Zap,          color: '#16a34a', bg: '#dcfce7' },
    { label: 'Pending',       value: eligible.length,                            icon: Users,        color: '#ea580c', bg: '#ffedd5' },
    { label: 'Notified',      value: customers.filter(c => c.notified).length,   icon: CheckCircle2, color: '#7c3aed', bg: '#ede9fe' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .ntf-kpi  { grid-template-columns: repeat(4, 1fr); }
        .ntf-tbl  { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .ntf-bnr  { flex-direction: row; align-items: center; }
        @media (max-width: 880px) {
          .ntf-kpi  { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .ntf-bnr  { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .ntf-kpi-card { padding: 14px 14px !important; }
          .ntf-kpi-val  { font-size: 18px !important; }
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
      <div className="ntf-kpi" style={{ display: 'grid', gap: 14 }}>
        {kpis.map(k => (
          <div key={k.label} className="ntf-kpi-card" style={{ ...CARD, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.6 }}>{k.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <k.icon size={16} color={k.color} />
              </div>
            </div>
            <div className="ntf-kpi-val" style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: -0.6 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Eligible banner */}
      {eligible.length > 0 && (
        <div className="ntf-bnr" style={{
          ...CARD,
          padding: '16px 22px',
          background: '#fff7ed',
          borderColor: '#fed7aa',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ffedd5', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={18} color="#ea580c" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2817', marginBottom: 3 }}>
                {eligible.length} repeat customers haven't been notified yet
              </div>
              <div style={{ fontSize: 11, color: '#ea580c' }}>
                {eligible.slice(0, 4).map(c => c.name.split(' ')[0]).join(', ')}{eligible.length > 4 ? ` +${eligible.length - 4} more` : ''}
              </div>
            </div>
          </div>
          <button onClick={sendBulk} disabled={sending} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#16a34a', color: '#fff',
            padding: '10px 20px', borderRadius: 8,
            fontWeight: 700, fontSize: 12, border: 'none',
            cursor: sending ? 'wait' : 'pointer',
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            flexShrink: 0,
          }}>
            <Zap size={14} />
            {sending ? 'Sending…' : `Send All (${eligible.length})`}
          </button>
        </div>
      )}

      {/* Notifications table */}
      <div style={CARD}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #d1fae5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2817' }}>Notification History</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{notifs.length} total</span>
        </div>
        <div className="ntf-tbl">
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>{['Customer', 'Phone', 'Type', 'Message', 'Sent At'].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {notifs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', fontSize: 13, color: '#9ca3af' }}>No notifications sent yet</td></tr>
            ) : notifs.map((n, idx) => {
              const tm = TYPE[n.type] || TYPE.repeat_customer;
              return (
                <tr key={n.id} style={{ background: idx % 2 ? '#fafffe' : '#fff' }}>
                  <td style={{ ...TD, fontWeight: 700, color: '#0f2817' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: tm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: tm.color, flexShrink: 0 }}>
                        {n.customerName.charAt(0)}
                      </div>
                      {n.customerName}
                    </div>
                  </td>
                  <td style={TD}>{n.customerPhone}</td>
                  <td style={TD}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5, background: tm.bg, color: tm.color }}>
                      <tm.icon size={10} />{tm.label}
                    </span>
                  </td>
                  <td style={{ ...TD, maxWidth: 300 }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={n.message}>
                      {n.message}
                    </div>
                  </td>
                  <td style={{ ...TD, whiteSpace: 'nowrap', color: '#9ca3af' }}>
                    {new Date(n.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
