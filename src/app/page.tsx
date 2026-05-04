'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Zap, BarChart3, ShoppingBag, Users, Bell, ChevronRight, Star,
  TrendingUp, Shield, ArrowUpRight, Sparkles, CheckCircle2, IndianRupee,
  Clock, Smartphone, QrCode,
} from 'lucide-react';

const features = [
  { icon: BarChart3,   title: 'Sales Analytics',      desc: 'Real-time revenue charts, daily trends, and top-item breakdown.', color: '#16a34a', bg: '#dcfce7' },
  { icon: ShoppingBag, title: 'Order Management',     desc: 'Take orders, track status, manage your kitchen queue live.',       color: '#2563eb', bg: '#dbeafe' },
  { icon: Users,       title: 'Customer Intelligence',desc: 'Auto-detect repeat customers and build loyalty profiles.',         color: '#7c3aed', bg: '#ede9fe' },
  { icon: Bell,        title: 'Smart Notifications',  desc: 'Send personalised messages to bring loyal customers back.',        color: '#ea580c', bg: '#ffedd5' },
  { icon: TrendingUp,  title: 'Revenue Insights',     desc: 'Weekly comparisons, avg order value, and growth metrics.',         color: '#ca8a04', bg: '#fef9c3' },
  { icon: Shield,      title: 'Data Security',        desc: 'Your business data stays yours — private and safe.',               color: '#0891b2', bg: '#cffafe' },
];

const stats = [
  { label: 'Restaurant Partners', value: '2,400+' },
  { label: 'Orders Tracked Daily', value: '18K+' },
  { label: 'Avg Revenue Lift',     value: '34%' },
  { label: 'Customer Retention',   value: '2.8×' },
];

const mockNotifs = [
  { name: 'Rahul ji',  msg: 'special offer aapke liye! 🎉',     tag: 'Loyalty' },
  { name: 'Priya didi', msg: 'Pav Bhaji ready hai! 🍛',          tag: 'Order' },
  { name: 'Deepak bhai', msg: '10% loyalty bonus today',         tag: 'Reward' },
];

const steps = [
  { n: '01', title: 'Sign up in 2 minutes',  desc: 'Add your shop, menu and UPI ID — no card needed.', icon: Sparkles },
  { n: '02', title: 'Share your shop link',  desc: 'Customers scan a QR or open your link to order.',  icon: QrCode },
  { n: '03', title: 'Get paid + grow',       desc: 'Money lands in your UPI. Repeat customers come back.', icon: IndianRupee },
];

const testimonials = [
  { name: 'Anil Kumar',     shop: 'Sharma Tiffin Center, Pune',     quote: '34% more orders in 2 months. The auto-notification thing actually works — old customers keep coming back.', rating: 5 },
  { name: 'Megha Patil',    shop: 'Megha\'s Kitchen, Nashik',        quote: 'Finally something simple. UPI orders go straight to my phone, no zomato cuts. Bahut sahi hai bhai.',         rating: 5 },
  { name: 'Vinod Choudhary', shop: 'Annapurna Dhaba, Indore',         quote: 'Pehle Excel pe sab manage karta tha. Ab dashboard pe sab dikhta hai — kaunsa item chal raha hai, kaunsa nahi.', rating: 5 },
];

export default function Landing() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(p => (p + 1) % mockNotifs.length), 2600);
    return () => clearInterval(t);
  }, []);

  const notif = mockNotifs[tick];

  return (
    <div style={{ background: '#fafffb', color: '#0f2817', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        .nav        { padding: 0 56px; }
        .nav-badge  { display: inline-block; }
        .nav-cta    { padding: 9px 18px; font-size: 13px; }
        .nav-ghost  { padding: 9px 16px; font-size: 13px; }

        .hero-wrap  { padding: 96px 24px 64px; gap: 56px; flex-direction: row; align-items: center; }
        .hero-copy  { text-align: left; max-width: 540px; }
        .hero-h1    { font-size: clamp(40px, 5.4vw, 60px); }
        .hero-sub   { font-size: 16px; max-width: 480px; }
        .hero-pill  { font-size: 12px; }
        .hero-ctas  { flex-direction: row; gap: 12px; justify-content: flex-start; }
        .hero-cta   { padding: 14px 28px; font-size: 14px; width: auto; }
        .hero-trust { justify-content: flex-start; }
        .hero-mock  { display: block; }

        .stats-row  { grid-template-columns: repeat(4, 1fr); }
        .stats-cell { padding: 32px 24px; }
        .stats-val  { font-size: 32px; }

        .steps-row   { grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .features-row { grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .features-h  { font-size: 34px; }
        .testi-row   { grid-template-columns: repeat(3, 1fr); gap: 16px; }

        .cta-box    { padding: 64px 56px; border-radius: 24px; }
        .cta-h2     { font-size: 36px; }
        .footer     { padding: 28px 56px; flex-direction: row; gap: 0; text-align: left; }

        @media (max-width: 980px) {
          .hero-wrap  { flex-direction: column; gap: 40px; padding: 64px 20px 48px; }
          .hero-copy  { text-align: center; max-width: 600px; }
          .hero-sub   { margin-left: auto; margin-right: auto; }
          .hero-ctas  { justify-content: center; }
          .hero-trust { justify-content: center; }
          .features-row { grid-template-columns: repeat(2, 1fr); }
          .testi-row    { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .nav        { padding: 0 16px; }
          .nav-badge  { display: none; }
          .nav-cta    { padding: 8px 12px; font-size: 12px; }
          .nav-cta-icon { display: none; }
          .nav-ghost  { padding: 8px 12px; font-size: 12px; }
          .hero-wrap  { padding: 40px 16px 40px; gap: 36px; }
          .hero-pill  { font-size: 11px; padding: 4px 14px 4px 6px; }
          .hero-h1    { font-size: 36px; line-height: 1.05; letter-spacing: -1; }
          .hero-sub   { font-size: 14px; line-height: 1.65; }
          .hero-ctas  { flex-direction: column; gap: 10px; align-items: stretch; padding: 0 8px; }
          .hero-cta   { padding: 14px 20px; font-size: 14px; width: 100%; justify-content: center; }
          .stats-row  { grid-template-columns: repeat(2, 1fr); }
          .stats-cell { padding: 22px 14px; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .stats-cell:nth-child(odd) { border-right: 1px solid rgba(255,255,255,0.08) !important; }
          .stats-cell:nth-last-child(-n+2) { border-bottom: none; }
          .stats-val  { font-size: 26px; }
          .steps-row    { grid-template-columns: 1fr; gap: 12px; }
          .features-section { padding: 56px 16px !important; }
          .features-row { grid-template-columns: 1fr; gap: 12px; }
          .features-h   { font-size: 26px; line-height: 1.18; }
          .testi-section { padding: 0 16px 56px !important; }
          .cta-section  { padding: 0 16px !important; margin-bottom: 48px !important; }
          .cta-box      { padding: 44px 24px; border-radius: 20px; }
          .cta-h2       { font-size: 24px; line-height: 1.18; }
          .footer       { padding: 22px 16px; flex-direction: column; gap: 8px; text-align: center; }
        }

        @keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.5; transform: scale(0.85) } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .feature-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease; }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(15,40,23,0.08); border-color: #a7f3d0; }
        .step-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .step-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(15,40,23,0.06); }
        .gradient-text { background: linear-gradient(90deg, #16a34a 0%, #059669 50%, #16a34a 100%); -webkit-background-clip: text; background-clip: text; color: transparent; background-size: 200% auto; animation: shimmer 6s linear infinite; }
        .notif-fade { animation: fadeUp 0.45s ease; }
      `}</style>

      {/* Decorative background blobs */}
      <div aria-hidden style={{
        position: 'absolute', top: -120, right: -120, width: 380, height: 380,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.18), transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div aria-hidden style={{
        position: 'absolute', top: 240, left: -160, width: 320, height: 320,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(5,150,105,0.12), transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Nav */}
      <nav className="nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'saturate(180%) blur(14px)',
        WebkitBackdropFilter: 'saturate(180%) blur(14px)',
        borderBottom: '1px solid rgba(187,247,208,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
          }}>
            <Zap size={17} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#0f2817', letterSpacing: -0.5 }}>Swiq</span>
          <span className="nav-badge" style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
            background: '#dcfce7', color: '#16a34a', marginLeft: 4,
          }}>
            RESTAURANT OS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/shop/login" className="nav-ghost" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#fff', color: '#16a34a',
            borderRadius: 9, fontWeight: 700, border: '1px solid #d1fae5',
            whiteSpace: 'nowrap',
          }}>
            Order Food
          </Link>
          <Link href="/login" className="nav-cta" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
            color: '#fff',
            borderRadius: 9, fontWeight: 700,
            boxShadow: '0 4px 14px rgba(22,163,74,0.32)',
            whiteSpace: 'nowrap',
          }}>
            Vendor Login <ChevronRight size={14} className="nav-cta-icon" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-wrap" style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1120, margin: '0 auto', display: 'flex',
      }}>
        {/* Left: copy */}
        <div className="hero-copy" style={{ flex: 1 }}>
          <div className="hero-pill" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#fff', border: '1px solid #bbf7d0',
            borderRadius: 100, padding: '5px 16px 5px 6px',
            color: '#374151', fontWeight: 500,
            boxShadow: '0 2px 8px rgba(22,163,74,0.08)',
            marginBottom: 24,
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
              borderRadius: 100, padding: '3px 9px', fontSize: 10, fontWeight: 800, color: '#fff',
              letterSpacing: 0.4,
            }}>NEW</span>
            <span>Auto-notification for repeat customers</span>
          </div>

          <h1 className="hero-h1" style={{
            fontWeight: 900, letterSpacing: -1.6, lineHeight: 1.04,
            marginBottom: 18, color: '#0f2817',
          }}>
            Smart tools for<br />
            <span className="gradient-text">smart restaurant</span><br />
            <span style={{ color: '#0f2817' }}>owners.</span>
          </h1>

          <p className="hero-sub" style={{
            color: '#4b5563', lineHeight: 1.65, marginBottom: 28,
          }}>
            Track sales, manage UPI orders, identify repeat customers, and send
            personalised notifications — all from one clean dashboard.
          </p>

          <div className="hero-ctas" style={{ display: 'flex', marginBottom: 26 }}>
            <Link href="/login" className="hero-cta" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#fff',
              borderRadius: 11, fontWeight: 800,
              boxShadow: '0 8px 24px rgba(22,163,74,0.4)',
              justifyContent: 'center',
            }}>
              Start Free <ArrowUpRight size={16} />
            </Link>
            <Link href="/shop" className="hero-cta" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: '#fff', color: '#0f2817',
              borderRadius: 11, fontWeight: 700,
              border: '1px solid #d1fae5',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              justifyContent: 'center',
            }}>
              View Customer App
            </Link>
          </div>

          {/* Trust row */}
          <div className="hero-trust" style={{
            display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'center',
            fontSize: 12, color: '#4b5563',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color="#16a34a" /> No setup fee
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color="#16a34a" /> Direct UPI payouts
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color="#16a34a" /> Hindi-friendly UI
            </div>
          </div>
        </div>

        {/* Right: device mock */}
        <div className="hero-mock" style={{
          flex: 1, position: 'relative', display: 'flex', justifyContent: 'center',
          maxWidth: 460,
        }}>
          {/* Glow */}
          <div aria-hidden style={{
            position: 'absolute', inset: -30, borderRadius: 40,
            background: 'radial-gradient(circle at 50% 40%, rgba(22,163,74,0.25), transparent 70%)',
            filter: 'blur(30px)', zIndex: 0,
          }} />

          {/* Phone frame */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: 280, padding: 12,
            borderRadius: 38,
            background: 'linear-gradient(160deg, #0f2817 0%, #052e16 100%)',
            boxShadow: '0 30px 60px rgba(15,40,23,0.28), 0 0 0 1px rgba(255,255,255,0.04) inset',
            animation: 'float 6s ease-in-out infinite',
          }}>
            {/* Notch */}
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              width: 90, height: 22, borderRadius: 12, background: '#000',
              zIndex: 2,
            }} />
            {/* Screen */}
            <div style={{
              borderRadius: 28, overflow: 'hidden',
              background: '#fafffb',
              minHeight: 520,
              padding: '38px 16px 18px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {/* Screen header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>Today</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f2817', letterSpacing: -0.4 }}>Dashboard</div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: '#dcfce7', borderRadius: 100,
                  padding: '4px 10px', fontSize: 10, fontWeight: 700, color: '#16a34a',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'pulse-dot 1.4s infinite' }} />
                  Live
                </div>
              </div>

              {/* Revenue card */}
              <div style={{
                background: 'linear-gradient(135deg, #052e16 0%, #14532d 100%)',
                borderRadius: 14, padding: '14px 14px',
                color: '#fff',
                position: 'relative', overflow: 'hidden',
              }}>
                <div aria-hidden style={{
                  position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                  borderRadius: '50%', background: 'rgba(74,222,128,0.18)',
                }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#a7f3d0', textTransform: 'uppercase', letterSpacing: 0.6 }}>Today&apos;s Revenue</div>
                  <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.6, marginTop: 2 }}>₹14,820</div>
                  <div style={{ fontSize: 10, color: '#86efac', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <TrendingUp size={10} /> +24% vs yesterday
                  </div>
                </div>

                {/* Mini bar chart */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 28, marginTop: 10, position: 'relative' }}>
                  {[40, 65, 50, 80, 55, 90, 100].map((h, i) => (
                    <div key={i} style={{
                      flex: 1, height: `${h}%`,
                      background: i === 6 ? '#4ade80' : 'rgba(167,243,208,0.4)',
                      borderRadius: 2,
                    }} />
                  ))}
                </div>
              </div>

              {/* Notification card (animated) */}
              <div key={tick} className="notif-fade" style={{
                background: '#fff', border: '1px solid #d1fae5',
                borderRadius: 12, padding: '11px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 4px 14px rgba(15,40,23,0.06)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: '#dbeafe', border: '1px solid #bfdbfe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bell size={14} color="#2563eb" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#0f2817' }}>{notif.name}</span>
                    <span style={{
                      fontSize: 8, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                      background: '#dcfce7', color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.4,
                    }}>{notif.tag}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {notif.msg}
                  </div>
                </div>
              </div>

              {/* Order rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: 'ORD-2841', who: 'Priya didi',  amt: 240, st: 'Preparing', col: '#2563eb', bg: '#dbeafe' },
                  { id: 'ORD-2840', who: 'Rahul ji',    amt: 180, st: 'UPI Paid',   col: '#16a34a', bg: '#dcfce7' },
                  { id: 'ORD-2839', who: 'Deepak bhai', amt: 320, st: 'Ready',      col: '#7c3aed', bg: '#ede9fe' },
                ].map(o => (
                  <div key={o.id} style={{
                    background: '#fff', border: '1px solid #f3f4f6',
                    borderRadius: 11, padding: '9px 11px',
                    display: 'flex', alignItems: 'center', gap: 9,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: o.bg, color: o.col,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 11, flexShrink: 0,
                    }}>
                      {o.who[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#0f2817' }}>{o.who}</div>
                      <div style={{ fontSize: 9, color: '#9ca3af' }}>{o.id}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0f2817' }}>₹{o.amt}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: o.col }}>{o.st}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating UPI badge */}
          <div aria-hidden style={{
            position: 'absolute', top: 28, left: -10, zIndex: 2,
            background: '#fff', border: '1px solid #d1fae5', borderRadius: 12,
            padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 12px 24px rgba(15,40,23,0.1)',
            animation: 'float 5s ease-in-out infinite',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: 'linear-gradient(135deg, #16a34a, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IndianRupee size={13} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600 }}>UPI in</div>
              <div style={{ fontSize: 11, color: '#0f2817', fontWeight: 800 }}>+₹240</div>
            </div>
          </div>

          {/* Floating star badge */}
          <div aria-hidden style={{
            position: 'absolute', bottom: 60, right: -10, zIndex: 2,
            background: '#fff', border: '1px solid #fde68a', borderRadius: 12,
            padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 12px 24px rgba(15,40,23,0.1)',
            animation: 'float 7s ease-in-out infinite',
          }}>
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <div>
              <div style={{ fontSize: 11, color: '#0f2817', fontWeight: 800 }}>4.9 / 5</div>
              <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 600 }}>2,400+ shops</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{
        background: 'linear-gradient(135deg, #052e16 0%, #064e3b 60%, #052e16 100%)',
        borderTop: '1px solid #064e3b', borderBottom: '1px solid #064e3b',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -50, left: '20%', width: 220, height: 220,
          borderRadius: '50%', background: 'rgba(74,222,128,0.1)', filter: 'blur(40px)',
        }} />
        <div className="stats-row" style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', display: 'grid' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="stats-cell" style={{
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <div className="stats-val" style={{
                fontWeight: 900, color: '#4ade80', letterSpacing: -1.2,
              }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#86efac', marginTop: 5, letterSpacing: 0.2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px 24px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: '#16a34a',
            textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 10,
          }}>How it works</div>
          <h2 className="features-h" style={{ fontWeight: 900, letterSpacing: -1, color: '#0f2817' }}>
            Live in three steps
          </h2>
        </div>
        <div className="steps-row" style={{ display: 'grid' }}>
          {steps.map((s) => (
            <div key={s.n} className="step-card" style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
              padding: '24px 22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              position: 'relative',
            }}>
              <div style={{
                fontSize: 11, fontWeight: 800, color: '#16a34a',
                letterSpacing: 1, marginBottom: 14,
              }}>{s.n}</div>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <s.icon size={20} color="#15803d" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0f2817', marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section" style={{ maxWidth: 1120, margin: '0 auto', padding: '56px 24px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: '#16a34a',
            textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 10,
          }}>Features</div>
          <h2 className="features-h" style={{ fontWeight: 900, letterSpacing: -1, color: '#0f2817' }}>
            Everything you need to run your restaurant
          </h2>
        </div>
        <div className="features-row" style={{ display: 'grid' }}>
          {features.map(f => (
            <div key={f.title} className="feature-card" style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 16, padding: '24px 22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: f.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <f.icon size={20} color={f.color} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, color: '#0f2817' }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testi-section" style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: '#16a34a',
            textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 10,
          }}>Loved by owners</div>
          <h2 className="features-h" style={{ fontWeight: 900, letterSpacing: -1, color: '#0f2817' }}>
            Restaurant owners who switched
          </h2>
        </div>
        <div className="testi-row" style={{ display: 'grid' }}>
          {testimonials.map(t => (
            <div key={t.name} style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
              padding: '22px 22px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.65, margin: 0 }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #dcfce7, #a7f3d0)',
                  color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13,
                }}>
                  {t.name[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0f2817' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.shop}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{ maxWidth: 1120, margin: '0 auto 80px', padding: '0 24px' }}>
        <div className="cta-box" style={{
          background: 'linear-gradient(135deg, #052e16 0%, #14532d 60%, #052e16 100%)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div aria-hidden style={{
            position: 'absolute', top: -80, right: -80, width: 260, height: 260,
            borderRadius: '50%', background: 'rgba(74,222,128,0.16)', filter: 'blur(20px)',
          }} />
          <div aria-hidden style={{
            position: 'absolute', bottom: -100, left: -60, width: 240, height: 240,
            borderRadius: '50%', background: 'rgba(22,163,74,0.18)', filter: 'blur(30px)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 18 }}>
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={17} fill="#4ade80" color="#4ade80" />)}
            </div>
            <h2 className="cta-h2" style={{ fontWeight: 900, letterSpacing: -1, marginBottom: 12, color: '#fff' }}>
              Bhai, ye to game changer hai!
            </h2>
            <p style={{ color: '#a7f3d0', fontSize: 15, marginBottom: 32 }}>
              Join 2,400+ restaurant owners already growing with Swiq.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fff', color: '#0f2817',
                padding: '14px 28px', borderRadius: 11, fontWeight: 800, fontSize: 14,
                boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
              }}>
                Get Started Free <ChevronRight size={16} />
              </Link>
              <Link href="/shop" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '14px 28px', borderRadius: 11, fontWeight: 700, fontSize: 14,
                border: '1px solid rgba(255,255,255,0.18)',
              }}>
                See Customer Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{
        borderTop: '1px solid #d1fae5', background: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'linear-gradient(135deg, #16a34a, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={12} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontWeight: 800, color: '#0f2817' }}>Swiq</span>
          <span style={{ color: '#9ca3af' }}>— Restaurant OS</span>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Made with ❤️ for Indian restaurant owners</div>
      </footer>
    </div>
  );
}
