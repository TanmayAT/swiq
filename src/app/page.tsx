'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Zap, BarChart3, ShoppingBag, Users, Bell, ChevronRight, Star, TrendingUp, Shield, ArrowUpRight } from 'lucide-react';

const features = [
  { icon: BarChart3,   title: 'Sales Analytics',        desc: 'Real-time revenue charts, daily trends, and top-item breakdown.', color: '#16a34a', bg: '#dcfce7' },
  { icon: ShoppingBag, title: 'Order Management',        desc: 'Take orders, track status, manage your kitchen queue live.',       color: '#2563eb', bg: '#dbeafe' },
  { icon: Users,       title: 'Customer Intelligence',   desc: 'Auto-detect repeat customers and build loyalty profiles.',         color: '#7c3aed', bg: '#ede9fe' },
  { icon: Bell,        title: 'Smart Notifications',     desc: 'Send personalised messages to bring loyal customers back.',        color: '#ea580c', bg: '#ffedd5' },
  { icon: TrendingUp,  title: 'Revenue Insights',        desc: 'Weekly comparisons, avg order value, and growth metrics.',         color: '#ca8a04', bg: '#fef9c3' },
  { icon: Shield,      title: 'Data Security',           desc: 'Your business data stays yours — private and safe.',               color: '#0891b2', bg: '#cffafe' },
];

const stats = [
  { label: 'Restaurant Partners', value: '2,400+' },
  { label: 'Orders Tracked Daily', value: '18K+' },
  { label: 'Avg Revenue Lift', value: '34%' },
  { label: 'Customer Retention', value: '2.8×' },
];

const mockNotifs = [
  'Rahul ji — special offer aapke liye! 🎉',
  'Priya didi, Pav Bhaji ready hai! 🍛',
  'Deepak bhai — 10% loyalty bonus today',
];

export default function Landing() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => (p + 1) % mockNotifs.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#f0fdf4', color: '#0f2817', minHeight: '100vh' }}>
      <style>{`
        .nav        { padding: 0 60px; }
        .nav-badge  { display: inline-block; }
        .nav-cta    { padding: 8px 20px; font-size: 13px; }
        .nav-ghost  { padding: 8px 16px; font-size: 13px; }
        .hero       { padding: 96px 24px 80px; }
        .hero-h1    { font-size: clamp(36px, 6vw, 62px); }
        .hero-sub   { font-size: 16px; margin: 0 auto 44px; }
        .hero-pill  { font-size: 12px; margin-bottom: 28px; }
        .hero-ctas  { flex-direction: row; gap: 12px; }
        .hero-cta   { padding: 13px 28px; font-size: 14px; width: auto; }
        .stats-row  { grid-template-columns: repeat(4, 1fr); }
        .stats-cell { padding: 28px 24px; }
        .stats-val  { font-size: 28px; }
        .features-row { grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .features-h { font-size: 30px; }
        .cta-box    { padding: 56px 48px; border-radius: 18px; }
        .cta-h2     { font-size: 30px; }
        .footer     { padding: 20px 60px; flex-direction: row; gap: 0; text-align: left; }

        @media (max-width: 760px) {
          .nav        { padding: 0 16px; }
          .nav-badge  { display: none; }
          .nav-cta    { padding: 7px 12px; font-size: 12px; }
          .nav-cta-icon { display: none; }
          .nav-ghost  { padding: 7px 12px; font-size: 12px; }
          .hero       { padding: 48px 18px 56px; }
          .hero-pill  { font-size: 11px; margin-bottom: 22px; padding: 4px 14px 4px 6px; }
          .hero-h1    { font-size: 34px; line-height: 1.1; letter-spacing: -1; }
          .hero-sub   { font-size: 14px; margin: 0 auto 32px; line-height: 1.6; }
          .hero-ctas  { flex-direction: column; gap: 10px; align-items: stretch; padding: 0 8px; }
          .hero-cta   { padding: 14px 20px; font-size: 14px; width: 100%; justify-content: center; }
          .notif-card { padding: 12px 14px !important; gap: 10px !important; max-width: 100% !important; }
          .stats-row  { grid-template-columns: repeat(2, 1fr); }
          .stats-cell { padding: 20px 14px; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .stats-cell:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.08) !important; }
          .stats-cell:nth-last-child(-n+2) { border-bottom: none; }
          .stats-val  { font-size: 24px; }
          .features-section { padding: 48px 18px !important; }
          .features-row { grid-template-columns: 1fr; gap: 12px; }
          .features-h { font-size: 22px; line-height: 1.2; }
          .cta-section { padding: 0 16px !important; margin-bottom: 48px !important; }
          .cta-box    { padding: 40px 24px; border-radius: 16px; }
          .cta-h2     { font-size: 22px; line-height: 1.2; }
          .footer     { padding: 18px 18px; flex-direction: column; gap: 6px; text-align: center; }
        }

        @media (min-width: 761px) and (max-width: 980px) {
          .features-row { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      {/* Nav */}
      <nav className="nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 58,
        background: '#fff', borderBottom: '1px solid #dcfce7',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#0f2817', letterSpacing: -0.4 }}>Swiq</span>
          <span className="nav-badge" style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', marginLeft: 4 }}>
            RESTAURANT OS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/shop/login" className="nav-ghost" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff', color: '#16a34a',
            borderRadius: 8, fontWeight: 700, border: '1px solid #d1fae5',
            whiteSpace: 'nowrap',
          }}>
            Order Food
          </Link>
          <Link href="/login" className="nav-cta" style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#16a34a', color: '#fff',
            borderRadius: 8, fontWeight: 700,
            boxShadow: '0 2px 8px rgba(22,163,74,0.3)',
            whiteSpace: 'nowrap',
          }}>
            Vendor Login <ChevronRight size={14} className="nav-cta-icon" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <div className="hero-pill" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: '#fff', border: '1px solid #bbf7d0',
          borderRadius: 100, padding: '5px 16px 5px 8px',
          color: '#374151', fontWeight: 500,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          maxWidth: '100%',
        }}>
          <span style={{ background: '#16a34a', borderRadius: 100, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>NEW</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Auto-notification for repeat customers</span>
        </div>

        <h1 className="hero-h1" style={{ fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.06, marginBottom: 20, color: '#0f2817' }}>
          Smart tools for<br />
          <span style={{ color: '#16a34a' }}>smart restaurant owners.</span>
        </h1>

        <p className="hero-sub" style={{ color: '#6b7280', lineHeight: 1.75, maxWidth: 500 }}>
          Track sales, manage orders, identify repeat customers, and send
          personalised notifications — all from one clean dashboard.
        </p>

        {/* Notification preview */}
        <div className="notif-card" style={{
          background: '#fff', border: '1px solid #bbf7d0',
          borderRadius: 14, padding: '16px 20px', maxWidth: 380, margin: '0 auto 36px',
          display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
          boxShadow: '0 4px 20px rgba(22,163,74,0.1)',
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: '#dbeafe', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={17} color="#2563eb" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, color: '#9ca3af', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Live Auto-Notification</div>
            <div style={{ fontSize: 12, color: '#0f2817', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mockNotifs[tick]}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} /> Live
          </div>
        </div>

        <div className="hero-ctas" style={{ display: 'flex', justifyContent: 'center' }}>
          <Link href="/login" className="hero-cta" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#16a34a', color: '#fff',
            borderRadius: 9, fontWeight: 800,
            boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
            justifyContent: 'center',
          }}>
            Start Free <ArrowUpRight size={16} />
          </Link>
          <Link href="/shop" className="hero-cta" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#fff', color: '#374151',
            borderRadius: 9, fontWeight: 600,
            border: '1px solid #d1fae5',
            justifyContent: 'center',
          }}>
            View Customer App
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ background: '#052e16', borderTop: '1px solid #064e3b', borderBottom: '1px solid #064e3b' }}>
        <div className="stats-row" style={{ maxWidth: 860, margin: '0 auto', display: 'grid' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="stats-cell" style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div className="stats-val" style={{ fontWeight: 900, color: '#4ade80', letterSpacing: -1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6ee7b7', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="features-section" style={{ maxWidth: 860, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10 }}>Features</div>
          <h2 className="features-h" style={{ fontWeight: 800, letterSpacing: -0.6, color: '#0f2817' }}>Everything you need to run your restaurant</h2>
        </div>
        <div className="features-row" style={{ display: 'grid' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 12, padding: '22px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={19} color={f.color} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 7, color: '#0f2817' }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{ maxWidth: 860, margin: '0 auto 72px', padding: '0 24px' }}>
        <div className="cta-box" style={{ background: '#052e16', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 18 }}>
            {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#4ade80" color="#4ade80" />)}
          </div>
          <h2 className="cta-h2" style={{ fontWeight: 900, letterSpacing: -0.5, marginBottom: 10, color: '#fff' }}>
            Bhai, ye to game changer hai!
          </h2>
          <p style={{ color: '#6ee7b7', fontSize: 14, marginBottom: 28 }}>
            Join 2,400+ restaurant owners already using Swiq.
          </p>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#16a34a', color: '#fff',
            padding: '14px 32px', borderRadius: 10, fontWeight: 800, fontSize: 15,
            boxShadow: '0 4px 20px rgba(22,163,74,0.4)',
          }}>
            Get Started <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ borderTop: '1px solid #d1fae5', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
          <Zap size={14} color="#16a34a" />
          <span style={{ fontWeight: 800, color: '#16a34a' }}>Swiq</span>
          <span style={{ color: '#9ca3af' }}>— Restaurant OS</span>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Made for Indian restaurant owners</div>
      </footer>
    </div>
  );
}
