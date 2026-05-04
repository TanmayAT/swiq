'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, X, ChevronUp, MapPin, Clock, Star, Phone, Zap, CheckCircle2, Search, Receipt, Wallet, Banknote, Smartphone, Copy, ChevronLeft } from 'lucide-react';

interface MenuItem { id: string; name: string; price: number; category: string; description: string; available: boolean; popular: boolean; }
interface Shop { name: string; tagline: string; phone: string; address: string; hours: string; isOpen: boolean; upiId: string; minOrder: number; deliveryTime: string; category: string; rating: string; totalRatings: number; }
interface CartItem extends MenuItem { qty: number; }

type Screen = 'menu' | 'cart' | 'checkout' | 'payment' | 'success';

const GREEN = '#16a34a';
const DARK  = '#0f2817';

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
  const [payState,  setPayState]  = useState<'pending' | 'paid'>('pending');
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

  /* ── checkout: create order, then go to payment screen ── */
  const placeOrder = async (paymentMethod: 'upi' | 'cash') => {
    if (!name.trim() || !phone.trim()) return;
    setPlacing(true);
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
    setPlacing(false);
    setOrderId(data.id || `ORD-${Date.now()}`);
    setOrderTotal(total);
    if (typeof window !== 'undefined') {
      localStorage.setItem('swiq_customer', JSON.stringify({ phone: phone.trim(), name: name.trim() }));
    }
    clearCart();
    setPayState('pending');
    setScreen(paymentMethod === 'upi' ? 'payment' : 'success');
  };

  /* Poll for server-side payment confirmation while on the payment screen.
     Today the vendor's "Mark Paid" button flips paymentStatus; later a real
     UPI gateway webhook (Setu / Razorpay) will hit the same endpoint. */
  useEffect(() => {
    if (screen !== 'payment' || !orderId) return;
    let stopped = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/orders?phone=${encodeURIComponent(phone.trim())}`);
        const list: { id: string; paymentStatus?: 'pending' | 'paid' }[] = await r.json();
        const me = list.find(o => o.id === orderId);
        if (!stopped && me?.paymentStatus === 'paid') {
          setPayState('paid');
          setTimeout(() => { if (!stopped) setScreen('success'); }, 1800);
        }
      } catch {}
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => { stopped = true; clearInterval(t); };
  }, [screen, orderId, phone]);

  /* ── UPI deeplink builders ── */
  const buildUpiLink = (scheme: string, pathPrefix = '') => {
    if (!shop) return '#';
    const params = new URLSearchParams({
      pa: shop.upiId,
      pn: shop.name,
      am: orderTotal.toFixed(2),
      cu: 'INR',
      tn: `Order ${orderId.slice(-6).toUpperCase()}`,
      tr: orderId,
    });
    return `${scheme}://${pathPrefix}pay?${params.toString()}`;
  };

  const openUpiApp = (scheme: string, pathPrefix = '') => {
    const link = buildUpiLink(scheme, pathPrefix);
    // Direct navigation — on Android this hands off to the UPI app; on desktop
    // the browser silently fails (we already gate this behind a mobile check).
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 32, textAlign: 'center', background: '#f0fdf4' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <CheckCircle2 size={44} color={GREEN} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: DARK, letterSpacing: -0.5, marginBottom: 8 }}>Order Placed!</div>
      <div style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>Your order <span style={{ fontWeight: 700, color: GREEN }}>{orderId}</span></div>
      <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32 }}>Preparing in {shop.deliveryTime} • We'll call you at {phone}</div>

      {shop.upiId && (
        <div style={{ background: '#fff', border: '1px solid #a7f3d0', borderRadius: 14, padding: '16px 24px', marginBottom: 24, width: '100%', maxWidth: 320 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Pay via UPI</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: GREEN, marginBottom: 4 }}>₹{total}</div>
          <div style={{ fontSize: 13, color: '#374151', fontFamily: 'monospace' }}>{shop.upiId}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
        <Link href="/shop/orders" style={{ background: GREEN, color: '#fff', padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
          Track Order
        </Link>
        <button onClick={() => { setScreen('menu'); setNote(''); }} style={{ background: '#fff', color: GREEN, padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: `1px solid ${GREEN}`, cursor: 'pointer' }}>
          Order More
        </button>
      </div>
    </div>
  );

  /* ── Payment screen (UPI deeplink) ── */
  if (screen === 'payment') {
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(buildUpiLink('upi'))}`;

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isAndroid = /android/i.test(ua);
    const isIOS     = /iphone|ipad|ipod/i.test(ua);
    const isMobile  = isAndroid || isIOS;

    // Correct UPI app schemes — universal `upi://` opens Android's UPI picker.
    // GPay India = `tez://`, PhonePe = `phonepe://`, Paytm = `paytmmp://`, BHIM uses universal upi://
    const apps = [
      { name: 'GPay',     scheme: 'tez',     pathPrefix: 'upi/', color: '#1a73e8', bg: '#e8f0fe' },
      { name: 'PhonePe',  scheme: 'phonepe', pathPrefix: '',     color: '#5f259f', bg: '#f3eaff' },
      { name: 'Paytm',    scheme: 'paytmmp', pathPrefix: '',     color: '#00baf2', bg: '#e0f7ff' },
      { name: 'BHIM',     scheme: 'upi',     pathPrefix: '',     color: '#ea580c', bg: '#fff1e6' },
    ];

    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: 32 }}>
        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setScreen('checkout')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><ChevronLeft size={22} color="#374151" /></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>Complete Payment</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Order #{orderId.slice(-6).toUpperCase()}</div>
          </div>
        </div>

        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Amount card */}
          <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, #14532d 100%)`, borderRadius: 16, padding: '24px 22px', color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(22,163,74,0.2)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Amount to Pay</div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, marginBottom: 4 }}>₹{orderTotal}</div>
              <div style={{ fontSize: 12, color: '#a7f3d0' }}>to {shop.name}</div>
            </div>
          </div>

          {/* Mobile: UPI app buttons. Desktop: scan-to-pay hint + QR. */}
          {isMobile ? (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 14 }}>
                <Smartphone size={14} color={GREEN} /> Pay with UPI App
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                {apps.map(a => (
                  <button key={a.name} onClick={() => openUpiApp(a.scheme, a.pathPrefix)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '12px 6px', borderRadius: 12,
                    background: a.bg, border: `1px solid ${a.color}30`,
                    cursor: 'pointer',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>
                      {a.name.charAt(0)}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: a.color }}>{a.name}</div>
                  </button>
                ))}
              </div>

              <button onClick={() => openUpiApp('upi')} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: GREEN, color: '#fff', padding: '13px',
                borderRadius: 10, fontWeight: 800, fontSize: 14, border: 'none',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
              }}>
                <Wallet size={16} /> Pay ₹{orderTotal} via Any UPI App
              </button>

              {isIOS && (
                <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
                  On iPhone, the chooser may not open. If nothing happens, scan the QR below from another device.
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#fff7ed', borderRadius: 14, border: '1px solid #fed7aa', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Smartphone size={20} color="#ea580c" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: '#9a3412', lineHeight: 1.5 }}>
                <strong style={{ color: '#7c2d12' }}>Scan the QR with your phone</strong> — UPI apps only work on mobile devices.
              </div>
            </div>
          )}

          {/* QR code (always shown — primary on desktop, fallback on mobile) */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: DARK, marginBottom: 12 }}>
              {isMobile ? 'Or Scan QR Code' : 'Scan to Pay'}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="UPI QR" width={200} height={200} style={{ display: 'block', margin: '0 auto', borderRadius: 8 }} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>Open any UPI app and scan</div>
          </div>

          {/* Manual UPI ID copy */}
          <div style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #a7f3d0', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Or pay manually to</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: DARK, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.upiId}</div>
            </div>
            <button onClick={copyUpi} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff', border: `1px solid ${GREEN}`, color: GREEN, padding: '8px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
              <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Live verification status — driven by server polling */}
          {payState === 'paid' ? (
            <div style={{ background: '#f0fdf4', borderRadius: 14, border: `2px solid ${GREEN}`, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <CheckCircle2 size={26} color={GREEN} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: DARK, marginBottom: 4 }}>Payment Confirmed</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Taking you to your order…</div>
            </div>
          ) : (
            <div style={{ background: '#eff6ff', borderRadius: 14, border: '1px solid #bfdbfe', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #bfdbfe', borderTopColor: '#2563eb', animation: 'spin 0.9s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
              </div>
              <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.55 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.4s infinite' }} />
                  <strong>Waiting for payment confirmation</strong>
                </div>
                <div style={{ marginTop: 3 }}>
                  Complete the UPI transfer — we'll detect it automatically and update your order. This usually takes a few seconds.
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
                padding: '13px', borderRadius: 14,
                fontWeight: 600, fontSize: 13, border: '1px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Receipt size={14} /> I'll wait on the order tracking page
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Checkout screen ── */
  if (screen === 'checkout') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => setScreen('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#374151" /></button>
        <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>Checkout</div>
      </div>

      <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Order summary */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: DARK, marginBottom: 12 }}>Your Order</div>
          {cart.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: '#374151' }}>{c.qty}× {c.name}</span>
              <span style={{ fontWeight: 700, color: DARK }}>₹{c.price * c.qty}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
            <span>Total</span>
            <span style={{ color: GREEN }}>₹{total}</span>
          </div>
        </div>

        {/* Delivery info */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: DARK, marginBottom: 14 }}>Your Details</div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name *</div>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${name ? '#a7f3d0' : '#e5e7eb'}`, fontSize: 14, color: DARK, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone *</div>
            <input
              value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="10-digit number"
              type="tel" inputMode="numeric"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${phone ? '#a7f3d0' : '#e5e7eb'}`, fontSize: 14, color: DARK, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Special Note (optional)</div>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="Less spicy, extra chutney…"
              rows={2}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 13, color: DARK, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Payment method picker */}
        {shop.upiId && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Choose Payment</div>

            <button
              onClick={() => placeOrder('upi')}
              disabled={placing || !name.trim() || phone.trim().length < 10}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: placing || !name.trim() || phone.trim().length < 10 ? '#86efac' : GREEN,
                color: '#fff', padding: '14px 18px', borderRadius: 12,
                fontWeight: 800, fontSize: 15, border: 'none',
                cursor: placing || !name.trim() || phone.trim().length < 10 ? 'not-allowed' : 'pointer',
                marginBottom: 10,
              }}
            >
              <Wallet size={18} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div>Pay ₹{total} via UPI</div>
                <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.9, marginTop: 2 }}>GPay · PhonePe · Paytm · BHIM</div>
              </div>
            </button>

            <button
              onClick={() => placeOrder('cash')}
              disabled={placing || !name.trim() || phone.trim().length < 10}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff', color: DARK,
                padding: '14px 18px', borderRadius: 12,
                fontWeight: 700, fontSize: 14, border: '1px solid #e5e7eb',
                cursor: placing || !name.trim() || phone.trim().length < 10 ? 'not-allowed' : 'pointer',
              }}
            >
              <Banknote size={18} color="#16a34a" />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div>Pay at Counter</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', marginTop: 2 }}>Cash on pickup</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Cart screen ── */
  if (screen === 'cart') return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: 120 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => setScreen('menu')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} color="#374151" /></button>
        <div style={{ fontWeight: 700, fontSize: 16, color: DARK }}>Your Cart</div>
        {cart.length > 0 && (
          <button onClick={clearCart} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Clear all</button>
        )}
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px' }}>
          <ShoppingCart size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Your cart is empty</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Add items from the menu</div>
          <button onClick={() => setScreen('menu')} style={{ background: GREEN, color: '#fff', padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cart.map(item => (
            <div key={item.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
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

          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '14px 16px', marginTop: 8 }}>
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
        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '14px 18px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setScreen('checkout')}
            disabled={total < shop.minOrder}
            style={{
              background: total < shop.minOrder ? '#86efac' : GREEN,
              color: '#fff', padding: '15px', borderRadius: 14,
              fontWeight: 800, fontSize: 15, border: 'none',
              cursor: total < shop.minOrder ? 'not-allowed' : 'pointer',
              width: '100%',
            }}
          >
            Proceed to Checkout · ₹{total}
          </button>
        </div>
      )}
    </div>
  );

  /* ── Menu screen ── */
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: 100 }}>

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
            width: '100%', background: GREEN, color: '#fff',
            padding: '15px 20px', borderRadius: 16,
            fontWeight: 800, fontSize: 15, border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 30px rgba(22,163,74,0.45)',
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
