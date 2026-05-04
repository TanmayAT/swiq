'use client';
import { useEffect, useState } from 'react';
import { Store, Clock, Phone, MapPin, Zap, ToggleLeft, ToggleRight, Save, ExternalLink, Copy } from 'lucide-react';

interface Shop {
  id: string; name: string; tagline: string; phone: string; address: string;
  hours: string; isOpen: boolean; upiId: string; minOrder: number;
  deliveryTime: string; category: string; rating: string; totalRatings: number;
}

const CARD: React.CSSProperties = { background: '#ffffff', border: '1px solid #d1fae5', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 };
const INPUT: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1px solid #d1fae5', fontSize: 13, color: '#0f2817',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
};

export default function SetupPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetch('/api/shop').then(r => r.json()).then(setShop); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const save = async () => {
    if (!shop) return;
    setSaving(true);
    await fetch('/api/shop', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(shop) });
    setSaving(false);
    showToast('Shop settings saved!');
  };

  const shopUrl = typeof window !== 'undefined' ? `${window.location.origin}/shop` : '/shop';

  const copyLink = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!shop) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
      <style>{`
        .setup-link { flex-direction: row; align-items: center; }
        @media (max-width: 880px) {
          .setup-grid  { grid-template-columns: 1fr !important; }
          .setup-link  { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .setup-link-actions { width: 100%; }
        }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 300,
          background: '#fff', border: '1px solid #a7f3d0', borderRadius: 10,
          padding: '12px 20px', color: '#16a34a', fontWeight: 700, fontSize: 13,
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
          {toast}
        </div>
      )}

      {/* Shop link banner */}
      <div className="setup-link" style={{ ...CARD, padding: '16px 22px', background: '#f0fdf4', borderColor: '#a7f3d0', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>Your Customer Shop Link</div>
          <div style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shopUrl}</div>
        </div>
        <div className="setup-link-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={copyLink} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #a7f3d0', background: '#fff', color: '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
            <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
          </button>
          <a href="/shop" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}>
            <ExternalLink size={13} /> Preview
          </a>
        </div>
      </div>

      {/* Shop open toggle */}
      <div style={{ ...CARD, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2817' }}>Shop Status</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            Customers can {shop.isOpen ? '' : 'NOT '}place orders right now
          </div>
        </div>
        <button onClick={() => setShop({ ...shop, isOpen: !shop.isOpen })} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          {shop.isOpen
            ? <ToggleRight size={44} color="#16a34a" />
            : <ToggleLeft  size={44} color="#9ca3af" />}
          <span style={{ fontSize: 13, fontWeight: 700, color: shop.isOpen ? '#16a34a' : '#9ca3af' }}>
            {shop.isOpen ? 'Open' : 'Closed'}
          </span>
        </button>
      </div>

      {/* Basic info */}
      <div style={{ ...CARD, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #d1fae5' }}>
          <Store size={16} color="#16a34a" />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f2817' }}>Shop Info</span>
        </div>
        <div className="setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL}>Shop Name</label>
            <input style={INPUT} value={shop.name} onChange={e => setShop({ ...shop, name: e.target.value })} placeholder="e.g. Raj's Kitchen" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL}>Tagline</label>
            <input style={INPUT} value={shop.tagline} onChange={e => setShop({ ...shop, tagline: e.target.value })} placeholder="A short catchy line" />
          </div>
          <div>
            <label style={LABEL}>Category / Cuisine</label>
            <input style={INPUT} value={shop.category} onChange={e => setShop({ ...shop, category: e.target.value })} placeholder="e.g. North Indian · Fast Food" />
          </div>
          <div>
            <label style={LABEL}>Min Order (₹)</label>
            <input style={INPUT} type="number" value={shop.minOrder} onChange={e => setShop({ ...shop, minOrder: Number(e.target.value) })} />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div style={{ ...CARD, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #d1fae5' }}>
          <Phone size={16} color="#16a34a" />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f2817' }}>Contact & Location</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={LABEL}>Phone Number</label>
            <input style={INPUT} value={shop.phone} onChange={e => setShop({ ...shop, phone: e.target.value })} placeholder="9876543210" />
          </div>
          <div>
            <label style={LABEL}>Address</label>
            <input style={INPUT} value={shop.address} onChange={e => setShop({ ...shop, address: e.target.value })} placeholder="Full address with landmark" />
          </div>
        </div>
      </div>

      {/* Timing & delivery */}
      <div style={{ ...CARD, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #d1fae5' }}>
          <Clock size={16} color="#16a34a" />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f2817' }}>Timing & Delivery</span>
        </div>
        <div className="setup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={LABEL}>Shop Hours</label>
            <input style={INPUT} value={shop.hours} onChange={e => setShop({ ...shop, hours: e.target.value })} placeholder="7:00 AM – 10:00 PM" />
          </div>
          <div>
            <label style={LABEL}>Delivery Time</label>
            <input style={INPUT} value={shop.deliveryTime} onChange={e => setShop({ ...shop, deliveryTime: e.target.value })} placeholder="15–20 min" />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div style={{ ...CARD, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #d1fae5' }}>
          <Zap size={16} color="#16a34a" />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f2817' }}>Payment</span>
        </div>
        <div>
          <label style={LABEL}>UPI ID</label>
          <input style={INPUT} value={shop.upiId} onChange={e => setShop({ ...shop, upiId: e.target.value })} placeholder="yourname@upi" />
          <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>Shown to customers on the checkout screen</div>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#16a34a', color: '#fff',
          padding: '12px 28px', borderRadius: 10,
          fontWeight: 700, fontSize: 13, border: 'none',
          cursor: saving ? 'wait' : 'pointer',
          boxShadow: '0 2px 12px rgba(22,163,74,0.3)',
        }}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
