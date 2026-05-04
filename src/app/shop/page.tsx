'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, Plus, Minus, X, ChevronUp, MapPin, Clock, Star, Phone, Zap,
  CheckCircle2, Search, Receipt, Wallet, Banknote, Smartphone, Copy, ChevronLeft,
  ShieldCheck, ArrowRight,
} from 'lucide-react';

interface MenuItem { id: string; name: string; price: number; category: string; description: string; available: boolean; popular: boolean; }
interface Shop { name: string; tagline: string; phone: string; address: string; hours: string; isOpen: boolean; upiId: string; minOrder: number; deliveryTime: string; category: string; rating: string; totalRatings: number; }
interface CartItem extends MenuItem { qty: number; }

type Screen = 'menu' | 'cart' | 'checkout' | 'payment' | 'success';

const GREEN = '#16a34a';
const DARK  = '#0f2817';

const STEPS: { key: Screen; label: string }[] = [
  { key: 'cart',     label: 'Cart' },
  { key: 'checkout', label: 'Details' },
  { key: 'payment',  label: 'Pay' },
];

function StepBar({ current }: { current: Screen }) {
  const idx = STEPS.findIndex(s => s.key === current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px 0' }}>
      {STEPS.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: done ? GREEN : active ? '#fff' : '#f3f4f6',
              border: `2px solid ${done || active ? GREEN : '#e5e7eb'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: active ? '0 0 0 4px rgba(22,163,74,0.15)' : 'none',
            }}>
              {done
                ? <CheckCircle2 size={12} color="#fff" />
                : <span style={{ fontSize: 10, fontWeight: 800, color: active ? GREEN : '#9ca3af' }}>{i + 1}</span>}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: done || active ? DARK : '#9ca3af',
              whiteSpace: 'nowrap',
            }}>{s.label}</span>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? GREEN : '#e5e7eb', borderRadius: 2 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ShopPage() {
  const [shop,      setShop]      = useState<Shop | null>(null);
  const [items,     setItems]     = useState<MenuItem[]>([]);
  const [cart,      setCart]      = useState<CartItem[]>([]);
  const [screen,    setScreen]    = useState<Screen>('menu');
  const [catFilter, setCatFilter] = useState('All');
  const [search,    setSearch]    = useState('');
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [note,      setNote]      = useState('');
  const [placing,   setPlacing]   = useState(false);
  const [orderId,   setOrderId]   = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [copied,    setCopied]    = useState(false);
  const [payState,  setPayState]  = useState<'pending' | 'paid' | 'failed' | 'expired'>('pending');
  const [paymentLink, setPaymentLink] = useState<{ upiLink: string; platformBillID: string; expiresAt: string } | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/shop').then(r => r.json()).then(setShop);
    fetch('/api/menu/items').then(r => r.json()).then((data: MenuItem[]) =>
      setItems(data.filter(i => i.available))
    );
    // Auto-fill from logged-in customer
    const raw = typeof window !== 'undefined' ? localStorage.getItem('swiq_customer') : null;
    if (raw) {
      const u = JSON.parse(raw);
      setName(u.name || ''); setPhone(u.phone || '');
    }
  }, []);

  /* ── cart helpers ── */
  const qty = (id: string) => cart.find(c => c.id === id)?.qty ?? 0;

  const add = (item: MenuItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id);
      return ex ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
                : [...prev, { ...item, qty: 1 }];
    });
  };

  const remove = (id: string) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === id);
      if (!ex) return prev;
      return ex.qty <= 1 ? prev.filter(c => c.id !== id) : prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
    });
  };

  const clearCart = () => setCart([]);

  const total     = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  const filtered   = items.filter(i => {
    const matchCat  = catFilter === 'All' || i.category === catFilter;
    const matchSrch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  /* Popular first within each category */
  const sortedFiltered = [...filtered].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));

  /* ── checkout: create order, initiate Setu payment, then go to payment screen ── */
  const placeOrder = async (paymentMethod: 'upi' | 'cash') => {
    if (!name.trim() || !phone.trim()) return;
    setPlacing(true);
    setLinkError(null);
    const orderItems = cart.map(c => ({ name: c.name, qty: c.qty, price: c.price }));
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name.trim(),
        customerPhone: phone.trim(),
        items: orderItems,
        total,
        note: note.trim(),
        source: 'customer',
        paymentMethod,
      }),
    });
    const data = await res.json();
    const newOrderId = data.id || `ORD-${Date.now()}`;
    setOrderId(newOrderId);
    setOrderTotal(total);
    if (typeof window !== 'undefined') {
      localStorage.setItem('swiq_customer', JSON.stringify({ phone: phone.trim(), name: name.trim() }));
    }

    if (paymentMethod === 'upi') {
      // Ask the backend (Setu in live mode, mock in dev) for the UPI link.
      // The client never builds the link itself — gateway is the source of truth.
      try {
        const initRes = await fetch('/api/payments/upi/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: newOrderId }),
        });
        const initData = await initRes.json();
        if (!initRes.ok) throw new Error(initData.error || 'Could not initiate payment');
        setPaymentLink({
          upiLink: initData.upiLink,
          platformBillID: initData.platformBillID,
          expiresAt: initData.expiresAt,
        });
      } catch (err) {
        setLinkError(err instanceof Error ? err.message : 'Payment init failed');
      }
    }

    setPlacing(false);
    clearCart();
    setPayState('pending');
    setScreen(paymentMethod === 'upi' ? 'payment' : 'success');
  };

  /* Poll the dedicated payment status endpoint. That endpoint's job is:
     1. Read our local state (set by Setu webhook when it fires).
     2. If still INITIATED, hit Setu's status API as a fallback (handles
        webhook delays). The client never has authority to flip state. */
  useEffect(() => {
    if (screen !== 'payment' || !orderId) return;
    let stopped = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`);
        const data: { paymentState?: string } = await r.json();
        if (stopped) return;
        if (data.paymentState === 'PAID' || data.paymentState === 'SETTLED') {
          setPayState('paid');
          setTimeout(() => { if (!stopped) setScreen('success'); }, 1600);
        } else if (data.paymentState === 'FAILED') {
          setPayState('failed');
        } else if (data.paymentState === 'EXPIRED') {
          setPayState('expired');
        }
      } catch {}
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => { stopped = true; clearInterval(t); };
  }, [screen, orderId]);

  /* ── UPI deeplink helpers ──
     Setu (or the mock) returns a canonical `upi://pay?...` link. For per-app
     buttons we just rewrite the scheme prefix — same query params, different
     handler. Universal `upi://` opens Android's UPI picker. */
  const rewriteScheme = (scheme: string, pathPrefix = '') => {
    if (!paymentLink?.upiLink) return '#';
    const after = paymentLink.upiLink.replace(/^upi:\/\//, '');
    return `${scheme}://${pathPrefix}${after}`;
  };

  const openUpiApp = (scheme: string, pathPrefix = '') => {
    const link = rewriteScheme(scheme, pathPrefix);
    if (link === '#') return;
    window.location.href = link;
  };


  const copyUpi = () => {
    if (!shop) return;
    navigator.clipboard.writeText(shop.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!shop) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${GREEN}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>Loading…</div>
      </div>
    </div>
  );

  /* ── Success screen ── */
  if (screen === 'success') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf4 0%, #fafffb 100%)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes pop { 0% { transform: scale(0.4); opacity: 0 } 60% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
        {/* Animated check */}
        <div style={{
          width: 92, height: 92, borderRadius: '50%',
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          border: `1px solid ${GREEN}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 22,
          boxShadow: '0 10px 30px rgba(22,163,74,0.25)',
          animation: 'pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <CheckCircle2 size={50} color={GREEN} strokeWidth={2.4} />
        </div>

        <div style={{ animation: 'slideUp 0.45s 0.15s both' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: DARK, letterSpacing: -0.6, marginBottom: 6 }}>
            Order Placed!
          </div>
          <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>
            Order <span style={{ fontFamily: 'monospace', fontWeight: 800, color: GREEN }}>#{orderId.slice(-6).toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 28 }}>
            Preparing in {shop.deliveryTime} • We&apos;ll call you at {phone}
          </div>
        </div>

        {orderTotal > 0 && (
          <div style={{
            background: '#fff', border: '1px solid #d1fae5', borderRadius: 16,
            padding: '18px 22px', marginBottom: 22, width: '100%', maxWidth: 320,
            boxShadow: '0 4px 16px rgba(15,40,23,0.06)',
            animation: 'slideUp 0.45s 0.25s both',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Total Paid</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: GREEN, letterSpacing: -1, marginBottom: 4 }}>₹{orderTotal}</div>
            {shop.upiId && (
              <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
                to {shop.upiId}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320, animation: 'slideUp 0.45s 0.35s both' }}>
          <Link href="/shop/orders" style={{
            background: GREEN, color: '#fff', padding: '14px 24px',
            borderRadius: 12, fontWeight: 800, fontSize: 14,
            textAlign: 'center',
            boxShadow: '0 6px 18px rgba(22,163,74,0.35)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            Track Order <ArrowRight size={15} />
          </Link>
          <button onClick={() => { setScreen('menu'); setNote(''); }} style={{
            background: '#fff', color: DARK,
            padding: '14px 24px', borderRadius: 12,
            fontWeight: 700, fontSize: 14,
            border: '1px solid #d1fae5', cursor: 'pointer',
          }}>
            Order More
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Payment screen (UPI deeplink) ── */
  if (screen === 'payment') {
    const qrSrc = paymentLink?.upiLink
      ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(paymentLink.upiLink)}`
      : '';

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isAndroid = /android/i.test(ua);
    const isIOS     = /iphone|ipad|ipod/i.test(ua);
    const isMobile  = isAndroid || isIOS;

    // Correct UPI app schemes — universal `upi://` opens Android's UPI picker.
    // GPay India = `tez://`, PhonePe = `phonepe://`, Paytm = `paytmmp://`, BHIM uses universal upi://
    const apps = [
      { name: 'GPay',     short: 'G',  scheme: 'tez',     pathPrefix: 'upi/', color: '#1a73e8', bg: '#eaf2fe' },
      { name: 'PhonePe',  short: 'P',  scheme: 'phonepe', pathPrefix: '',     color: '#5f259f', bg: '#f3eaff' },
      { name: 'Paytm',    short: 'P',  scheme: 'paytmmp', pathPrefix: '',     color: '#00baf2', bg: '#e0f7ff' },
      { name: 'BHIM',     short: 'B',  scheme: 'upi',     pathPrefix: '',     color: '#ea580c', bg: '#fff1e6' },
    ];

    return (
      <div style={{ minHeight: '100vh', background: '#f5f7f6', paddingBottom: 32 }}>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
          @keyframes shine { 0% { transform: translateX(-110%) } 100% { transform: translateX(210%) } }
        `}</style>

        {/* Header */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => setScreen('checkout')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ChevronLeft size={22} color="#374151" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: DARK }}>Complete Payment</div>
            <div style={{ fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <ShieldCheck size={11} color={GREEN} /> Secure UPI · Order #{orderId.slice(-6).toUpperCase()}
            </div>
          </div>
        </div>

        <StepBar current="payment" />

        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Amount card — premium ticket style */}
          <div style={{
            background: `linear-gradient(135deg, ${DARK} 0%, #14532d 60%, #052e16 100%)`,
            borderRadius: 18, padding: '22px 22px',
            color: '#fff', position: 'relative', overflow: 'hidden',
            boxShadow: '0 14px 30px rgba(15,40,23,0.25)',
          }}>
            <div aria-hidden style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(74,222,128,0.18)' }} />
            <div aria-hidden style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(22,163,74,0.18)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: 0.8 }}>Paying to</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 3, letterSpacing: -0.3 }}>{shop.name}</div>
                  <div style={{ fontSize: 11, color: '#a7f3d0', fontFamily: 'monospace', marginTop: 2 }}>{shop.upiId}</div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 18, color: '#fff',
                  flexShrink: 0,
                }}>{shop.name.charAt(0)}</div>
              </div>

              <div style={{
                borderTop: '1px dashed rgba(255,255,255,0.25)',
                paddingTop: 14, marginTop: 4,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Amount</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>₹</span>
                    <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1 }}>{orderTotal}</span>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.4)',
                  borderRadius: 100, padding: '5px 11px',
                }}>
                  <ShieldCheck size={12} color="#4ade80" />
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#4ade80', letterSpacing: 0.3 }}>VERIFIED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Link-loading & error gates ─ only render the pay options once we
              have a Setu link. Without it, paying would mean nothing flows
              back to us. */}
          {!paymentLink && !linkError && (
            <div style={{
              background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
              padding: '24px 18px', textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ width: 36, height: 36, margin: '0 auto 12px', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid #d1fae5`, borderTopColor: GREEN, animation: 'spin 0.8s linear infinite' }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: DARK, marginBottom: 4 }}>Preparing your secure payment link…</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>This takes a second.</div>
            </div>
          )}

          {linkError && (
            <div style={{
              background: '#fef2f2', borderRadius: 14, border: '1px solid #fecaca',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>Could not start payment</div>
              <div style={{ fontSize: 11, color: '#7f1d1d', marginBottom: 10 }}>{linkError}</div>
              <button
                onClick={async () => {
                  setLinkError(null);
                  try {
                    const r = await fetch('/api/payments/upi/initiate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderId }),
                    });
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.error || 'failed');
                    setPaymentLink({ upiLink: d.upiLink, platformBillID: d.platformBillID, expiresAt: d.expiresAt });
                  } catch (e) {
                    setLinkError(e instanceof Error ? e.message : 'failed');
                  }
                }}
                style={{
                  background: '#dc2626', color: '#fff', border: 'none',
                  padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Mobile: UPI app buttons. Desktop: scan-to-pay hint + QR. */}
          {paymentLink && (isMobile ? (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '16px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: DARK, marginBottom: 14 }}>
                <Smartphone size={14} color={GREEN} /> Pay with your UPI app
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                {apps.map(a => (
                  <button key={a.name} onClick={() => openUpiApp(a.scheme, a.pathPrefix)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '12px 4px', borderRadius: 12,
                    background: '#fff', border: `1px solid #e5e7eb`,
                    cursor: 'pointer',
                    transition: 'transform 0.12s ease, border-color 0.12s ease',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, background: a.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: a.color, fontWeight: 900, fontSize: 16,
                      border: `1px solid ${a.color}25`,
                    }}>
                      {a.short}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: DARK }}>{a.name}</div>
                  </button>
                ))}
              </div>

              <button onClick={() => openUpiApp('upi')} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: `linear-gradient(135deg, ${GREEN} 0%, #15803d 100%)`,
                color: '#fff', padding: '14px',
                borderRadius: 12, fontWeight: 800, fontSize: 14, border: 'none',
                cursor: 'pointer', boxShadow: '0 6px 18px rgba(22,163,74,0.35)',
                position: 'relative', overflow: 'hidden',
              }}>
                <Wallet size={16} /> Pay ₹{orderTotal} via Any UPI App
                <span aria-hidden style={{
                  position: 'absolute', top: 0, left: 0, height: '100%', width: '40%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                  animation: 'shine 2.6s linear infinite',
                }} />
              </button>

              {isIOS && (
                <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
                  On iPhone, the chooser may not open. If nothing happens, scan the QR below from another device.
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              borderRadius: 14, border: '1px solid #fed7aa',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#fff', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #fed7aa',
              }}>
                <Smartphone size={18} color="#ea580c" />
              </div>
              <div style={{ fontSize: 12, color: '#9a3412', lineHeight: 1.5 }}>
                <strong style={{ color: '#7c2d12' }}>Scan the QR with your phone</strong> — UPI apps only work on mobile devices.
              </div>
            </div>
          ))}

          {/* QR card — receipt style with side perforations */}
          {paymentLink && qrSrc && (
          <div style={{
            background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb',
            padding: '20px 18px', textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            position: 'relative',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: GREEN,
              textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
            }}>
              {isMobile ? 'Or scan QR' : 'Scan to pay'}
            </div>
            <div style={{
              display: 'inline-block', padding: 10,
              borderRadius: 14, background: '#fff',
              border: '2px solid #d1fae5',
              position: 'relative',
            }}>
              {/* Corner brackets */}
              {([
                [0, 0, 'tl'], [0, 1, 'tr'], [1, 0, 'bl'], [1, 1, 'br'],
              ] as const).map(([y, x, k]) => (
                <div key={k} aria-hidden style={{
                  position: 'absolute',
                  [y === 0 ? 'top' : 'bottom']: -2,
                  [x === 0 ? 'left' : 'right']: -2,
                  width: 16, height: 16,
                  borderTop:    y === 0 ? `3px solid ${GREEN}` : 'none',
                  borderBottom: y === 1 ? `3px solid ${GREEN}` : 'none',
                  borderLeft:   x === 0 ? `3px solid ${GREEN}` : 'none',
                  borderRight:  x === 1 ? `3px solid ${GREEN}` : 'none',
                  borderRadius: y === 0
                    ? (x === 0 ? '6px 0 0 0' : '0 6px 0 0')
                    : (x === 0 ? '0 0 0 6px' : '0 0 6px 0'),
                }} />
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="UPI QR" width={210} height={210} style={{ display: 'block', borderRadius: 6 }} />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <ShieldCheck size={11} color={GREEN} />
              Open any UPI app and scan
            </div>
          </div>
          )}

          {/* Manual UPI ID copy */}
          <div style={{
            background: '#f0fdf4', borderRadius: 14, border: '1px solid #a7f3d0',
            padding: '13px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: GREEN, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>Or pay manually to</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: DARK, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.upiId}</div>
            </div>
            <button onClick={copyUpi} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: copied ? GREEN : '#fff',
              border: `1px solid ${GREEN}`, color: copied ? '#fff' : GREEN,
              padding: '8px 14px', borderRadius: 9,
              fontWeight: 800, fontSize: 12, cursor: 'pointer', flexShrink: 0,
              transition: 'all 0.18s ease',
            }}>
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Live verification status — driven by server polling */}
          {payState === 'paid' ? (
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: 16, border: `2px solid ${GREEN}`,
              padding: '20px 16px', textAlign: 'center',
              boxShadow: '0 8px 24px rgba(22,163,74,0.18)',
            }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 4px 12px rgba(22,163,74,0.2)' }}>
                <CheckCircle2 size={28} color={GREEN} strokeWidth={2.5} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: DARK, marginBottom: 3 }}>Payment Confirmed</div>
              <div style={{ fontSize: 12, color: '#374151' }}>Taking you to your order…</div>
            </div>
          ) : payState === 'failed' ? (
            <div style={{
              background: '#fef2f2', borderRadius: 14, border: '1px solid #fecaca',
              padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>Payment failed</div>
              <div style={{ fontSize: 12, color: '#7f1d1d' }}>Try again or pick a different UPI app.</div>
            </div>
          ) : payState === 'expired' ? (
            <div style={{
              background: '#fff7ed', borderRadius: 14, border: '1px solid #fed7aa',
              padding: '16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#9a3412', marginBottom: 4 }}>Link expired</div>
              <div style={{ fontSize: 12, color: '#7c2d12' }}>Place the order again to retry.</div>
            </div>
          ) : (
            <div style={{
              background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #dbeafe', borderTopColor: '#2563eb', animation: 'spin 0.9s linear infinite' }} />
              </div>
              <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.55, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.4s infinite' }} />
                  <strong>Waiting for payment confirmation</strong>
                </div>
                <div style={{ marginTop: 3, color: '#475569' }}>
                  Complete the UPI transfer — we&apos;ll detect it automatically.
                </div>
              </div>
            </div>
          )}

          {/* Skip button — they can wait on the order tracking page instead */}
          {payState !== 'paid' && (
            <button
              onClick={() => setScreen('success')}
              style={{
                background: '#fff', color: '#374151',
                padding: '13px', borderRadius: 12,
                fontWeight: 700, fontSize: 13, border: '1px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Receipt size={14} /> I&apos;ll wait on the order tracking page
            </button>
          )}

          {/* Trust strip */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontSize: 10, color: '#9ca3af', marginTop: 4,
            padding: '6px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={12} color={GREEN} /> Secured by UPI
            </div>
            <span>•</span>
            <div>Powered by NPCI</div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Checkout screen ── */
  if (screen === 'checkout') {
    const canPlace = !placing && name.trim() && phone.trim().length >= 10;
    return (
      <div style={{ minHeight: '100vh', background: '#f5f7f6', paddingBottom: 32 }}>
        {/* Header */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <button onClick={() => setScreen('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ChevronLeft size={22} color="#374151" />
          </button>
          <div style={{ fontWeight: 800, fontSize: 16, color: DARK }}>Checkout</div>
        </div>

        <StepBar current="checkout" />

        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Order summary */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 13, color: DARK, marginBottom: 12 }}>
              <Receipt size={14} color={GREEN} /> Your Order
            </div>
            {cart.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#374151' }}>
                  <span style={{ display: 'inline-block', minWidth: 22, fontWeight: 700, color: GREEN }}>{c.qty}×</span>
                  {c.name}
                </span>
                <span style={{ fontWeight: 700, color: DARK }}>₹{c.price * c.qty}</span>
              </div>
            ))}
            <div style={{
              borderTop: '1px dashed #e5e7eb', paddingTop: 10, marginTop: 4,
              display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15,
            }}>
              <span>Total</span>
              <span style={{ color: GREEN }}>₹{total}</span>
            </div>
          </div>

          {/* Delivery info */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: DARK, marginBottom: 14 }}>Your Details</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name *</div>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${name ? '#a7f3d0' : '#e5e7eb'}`, fontSize: 14, color: DARK, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone *</div>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="10-digit number"
                type="tel" inputMode="numeric"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${phone ? '#a7f3d0' : '#e5e7eb'}`, fontSize: 14, color: DARK, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Special Note (optional)</div>
              <textarea
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="Less spicy, extra chutney…"
                rows={2}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, color: DARK, outline: 'none', resize: 'none', boxSizing: 'border-box', background: '#fff' }}
              />
            </div>
          </div>

          {/* Payment method picker */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Choose Payment</div>

            {shop.upiId && (
              <button
                onClick={() => placeOrder('upi')}
                disabled={!canPlace}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  background: canPlace
                    ? `linear-gradient(135deg, ${GREEN} 0%, #15803d 100%)`
                    : '#86efac',
                  color: '#fff', padding: '14px 16px', borderRadius: 12,
                  fontWeight: 800, fontSize: 14, border: 'none',
                  cursor: canPlace ? 'pointer' : 'not-allowed',
                  marginBottom: 10,
                  boxShadow: canPlace ? '0 6px 18px rgba(22,163,74,0.32)' : 'none',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Wallet size={18} color="#fff" />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>Pay ₹{total} via UPI</div>
                  <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.9, marginTop: 2 }}>GPay · PhonePe · Paytm · BHIM</div>
                </div>
                <ArrowRight size={16} />
              </button>
            )}

            <button
              onClick={() => placeOrder('cash')}
              disabled={!canPlace}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff', color: DARK,
                padding: '14px 16px', borderRadius: 12,
                fontWeight: 700, fontSize: 14, border: '1px solid #e5e7eb',
                cursor: canPlace ? 'pointer' : 'not-allowed',
                opacity: canPlace ? 1 : 0.6,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#dcfce7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Banknote size={18} color={GREEN} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div>Pay at Counter</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', marginTop: 2 }}>Cash on pickup</div>
              </div>
              <ChevronUp size={16} color="#9ca3af" style={{ transform: 'rotate(90deg)' }} />
            </button>
          </div>

          {/* Trust strip */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 11, color: '#9ca3af', marginTop: 4,
          }}>
            <ShieldCheck size={12} color={GREEN} />
            Your details stay private. Payment is secured by UPI.
          </div>
        </div>
      </div>
    );
  }

  /* ── Cart screen ── */
  if (screen === 'cart') return (
    <div style={{ minHeight: '100vh', background: '#f5f7f6', paddingBottom: 120 }}>
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => setScreen('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
          <X size={20} color="#374151" />
        </button>
        <div style={{ fontWeight: 800, fontSize: 16, color: DARK }}>Your Cart</div>
        {cart.length > 0 && (
          <button onClick={clearCart} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#dc2626', fontWeight: 700 }}>Clear all</button>
        )}
      </div>

      {cart.length > 0 && <StepBar current="cart" />}

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%', background: '#fff',
            border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            <ShoppingCart size={38} color="#d1d5db" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#374151', marginBottom: 6 }}>Your cart is empty</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Add items from the menu</div>
          <button onClick={() => setScreen('menu')} style={{
            background: GREEN, color: '#fff', padding: '12px 28px', borderRadius: 12,
            fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(22,163,74,0.32)',
          }}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cart.map(item => (
            <div key={item.id} style={{
              background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{item.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>₹{item.price} each</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => remove(item.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid ${GREEN}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Minus size={13} color={GREEN} />
                </button>
                <span style={{ fontWeight: 800, fontSize: 16, color: DARK, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                <button onClick={() => add(item)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={13} color="#fff" />
                </button>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: DARK, minWidth: 52, textAlign: 'right' }}>₹{item.price * item.qty}</div>
            </div>
          ))}

          <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
            padding: '14px 16px', marginTop: 4,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151', marginBottom: 6 }}>
              <span>Subtotal</span><span>₹{total}</span>
            </div>
            {total < shop.minOrder && (
              <div style={{ fontSize: 11, color: '#ea580c', marginBottom: 4 }}>
                Add ₹{shop.minOrder - total} more to meet minimum order of ₹{shop.minOrder}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px dashed #e5e7eb', paddingTop: 10, marginTop: 4 }}>
              <span>Total</span><span style={{ color: GREEN }}>₹{total}</span>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 480, padding: '14px 18px',
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
          borderTop: '1px solid #e5e7eb',
        }}>
          <button
            onClick={() => setScreen('checkout')}
            disabled={total < shop.minOrder}
            style={{
              background: total < shop.minOrder
                ? '#86efac'
                : `linear-gradient(135deg, ${GREEN} 0%, #15803d 100%)`,
              color: '#fff', padding: '15px', borderRadius: 14,
              fontWeight: 800, fontSize: 15, border: 'none',
              cursor: total < shop.minOrder ? 'not-allowed' : 'pointer',
              width: '100%',
              boxShadow: total < shop.minOrder ? 'none' : '0 8px 22px rgba(22,163,74,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            Proceed to Checkout · ₹{total} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );

  /* ── Menu screen ── */
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f6', paddingBottom: 100 }}>

      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, #14532d 100%)`, padding: '24px 18px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(22,163,74,0.2)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(22,163,74,0.15)' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Status badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: shop.isOpen ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)', border: `1px solid ${shop.isOpen ? 'rgba(22,163,74,0.5)' : 'rgba(220,38,38,0.5)'}`, borderRadius: 20, padding: '4px 12px', marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: shop.isOpen ? '#4ade80' : '#f87171' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: shop.isOpen ? '#4ade80' : '#f87171' }}>{shop.isOpen ? 'Open Now' : 'Currently Closed'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.6, marginBottom: 4 }}>{shop.name}</div>
              <div style={{ fontSize: 12, color: '#a7f3d0', marginBottom: 16 }}>{shop.tagline}</div>
            </div>
            <Link href="/shop/orders" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '7px 12px', textDecoration: 'none', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              <Receipt size={13} /> My Orders
            </Link>
          </div>

          {/* Info chips */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#d1fae5' }}>
              <Star size={11} fill="#fbbf24" color="#fbbf24" /> <span style={{ fontWeight: 700 }}>{shop.rating}</span> ({shop.totalRatings})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#d1fae5' }}>
              <Clock size={11} color="#a7f3d0" /> {shop.deliveryTime}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#d1fae5' }}>
              <Zap size={11} color="#a7f3d0" /> Min ₹{shop.minOrder}
            </div>
          </div>
        </div>
      </div>

      {/* Info strip */}
      {shop.address && (
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9ca3af', flex: 1 }}>
            <MapPin size={11} color={GREEN} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shop.address}</span>
          </div>
          <a href={`tel:${shop.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: GREEN, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
            <Phone size={11} /> {shop.phone}
          </a>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color="#9ca3af" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search dishes…"
            style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, color: DARK, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Category pills */}
      <div ref={catRef} style={{ display: 'flex', gap: 8, padding: '12px 18px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <style>{`::-webkit-scrollbar{display:none}`}</style>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} style={{
            flexShrink: 0, padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: catFilter === c ? GREEN : '#fff',
            color: catFilter === c ? '#fff' : '#374151',
            border: catFilter === c ? 'none' : '1px solid #e5e7eb',
            cursor: 'pointer',
            boxShadow: catFilter === c ? '0 2px 8px rgba(22,163,74,0.3)' : 'none',
          }}>{c}</button>
        ))}
      </div>

      {/* Menu items */}
      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!shop.isOpen && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 18px', textAlign: 'center', fontSize: 13, color: '#ea580c', fontWeight: 600 }}>
            Shop is currently closed · Orders not accepted right now
          </div>
        )}

        {sortedFiltered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', fontSize: 13, color: '#9ca3af' }}>
            No items found
          </div>
        )}

        {sortedFiltered.map(item => {
          const q = qty(item.id);
          return (
            <div key={item.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {/* Color swatch / initial */}
              <div style={{ width: 52, height: 52, borderRadius: 12, background: item.popular ? '#dcfce7' : '#f0fdf4', border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {item.popular ? '⭐' : '🍽'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  {item.popular && <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '2px 7px', borderRadius: 4 }}>POPULAR</span>}
                </div>
                {item.description && (
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
                )}
                <div style={{ fontWeight: 800, fontSize: 15, color: GREEN, marginTop: 4 }}>₹{item.price}</div>
              </div>

              {/* Add / qty controls */}
              {shop.isOpen && (
                q === 0 ? (
                  <button onClick={() => add(item)} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', border: 'none', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.4)' }}>
                    <Plus size={16} color="#fff" />
                  </button>
                ) : (
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => remove(item.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: `2px solid ${GREEN}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Minus size={12} color={GREEN} />
                    </button>
                    <span style={{ fontWeight: 800, fontSize: 15, color: DARK, minWidth: 18, textAlign: 'center' }}>{q}</span>
                    <button onClick={() => add(item)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Plus size={12} color="#fff" />
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: 'calc(100% - 36px)', maxWidth: 444 }}>
          <button onClick={() => setScreen('cart')} style={{
            width: '100%',
            background: `linear-gradient(135deg, ${GREEN} 0%, #15803d 100%)`,
            color: '#fff',
            padding: '15px 20px', borderRadius: 16,
            fontWeight: 800, fontSize: 15, border: 'none',
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(22,163,74,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 8, padding: '3px 9px', fontSize: 13, fontWeight: 800 }}>{cartCount}</div>
              <span>View Cart</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>₹{total}</span>
              <ChevronUp size={16} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
