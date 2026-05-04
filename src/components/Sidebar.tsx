'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Users, Bell, Settings, HelpCircle, Zap, UtensilsCrossed, Store, X } from 'lucide-react';

const nav = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/orders',        label: 'Orders',         icon: ShoppingBag },
  { href: '/customers',     label: 'Customers',      icon: Users },
  { href: '/notifications', label: 'Notifications',  icon: Bell },
  { href: '/menu',          label: 'Menu',           icon: UtensilsCrossed },
  { href: '/setup',         label: 'My Shop',        icon: Store },
];

const bottom = [
  { href: '#', label: 'Settings', icon: Settings },
  { href: '#', label: 'Help',     icon: HelpCircle },
];

interface Props { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: Props) {
  const path = usePathname();

  return (
    <>
      <style>{`
        .sb {
          width: 220px; min-height: 100vh;
          background: var(--sidebar);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; z-index: 50;
          transform: translateX(0);
          transition: transform 0.25s ease;
        }
        @media (max-width: 880px) {
          .sb { transform: translateX(-110%); box-shadow: 4px 0 24px rgba(0,0,0,0.2); }
          .sb.sb-open { transform: translateX(0); }
          .sb-close { display: flex !important; }
        }
      `}</style>
      <aside className={`sb ${open ? 'sb-open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '18px 18px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 0 14px rgba(22,163,74,0.4)',
            }}>
              <Zap size={17} color="#fff" fill="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: -0.4 }}>Swiq</div>
              <div style={{ fontSize: 10, color: 'var(--s-muted)', marginTop: -1 }}>Restaurant OS</div>
            </div>
          </div>
          <button
            className="sb-close"
            onClick={onClose}
            style={{ display: 'none', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--s-muted)',
            textTransform: 'uppercase', letterSpacing: 1,
            padding: '10px 8px 6px',
          }}>Menu</div>

          {nav.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  background: active ? 'rgba(22,163,74,0.25)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--s-text)',
                  cursor: 'pointer',
                  fontWeight: active ? 700 : 400,
                  fontSize: 13,
                  borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.12s',
                }}>
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.8} />
                  {label}
                  {active && (
                    <div style={{
                      marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--accent)',
                    }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {bottom.map(({ href, label, icon: Icon }) => (
            <Link key={label} href={href}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8, marginBottom: 2,
                color: 'var(--s-muted)', cursor: 'pointer', fontSize: 13,
              }}>
                <Icon size={15} strokeWidth={1.6} />
                {label}
              </div>
            </Link>
          ))}

          {/* User card */}
          <div style={{
            marginTop: 10, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>R</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Raj Kumar</div>
              <div style={{ fontSize: 10, color: 'var(--s-muted)' }}>Owner</div>
            </div>
            <div style={{
              marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
              background: 'var(--accent)', flexShrink: 0,
              boxShadow: '0 0 6px rgba(22,163,74,0.8)',
            }} />
          </div>
        </div>
      </aside>
    </>
  );
}
