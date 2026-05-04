'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Bell, Search, ChevronDown, LogOut, Menu } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/orders':        'Orders',
  '/customers':     'Customers',
  '/notifications': 'Notifications',
  '/menu':          'Menu',
  '/setup':         'My Shop',
};

interface Vendor { ownerName: string; shopName: string; phone: string; }

interface Props { onMenuClick: () => void; }

export default function Header({ onMenuClick }: Props) {
  const path = usePathname();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = localStorage.getItem('swiq_vendor');
    if (raw) try { setVendor(JSON.parse(raw)); } catch {}
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const logout = () => {
    localStorage.removeItem('swiq_vendor');
    router.push('/login');
  };

  const title = Object.entries(TITLES).find(([k]) => path.startsWith(k))?.[1] ?? 'Dashboard';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const initial = vendor?.ownerName?.charAt(0).toUpperCase() || 'R';
  const display = vendor?.ownerName || 'Raj Kumar';

  return (
    <>
      <style>{`
        .hdr        { padding: 0 28px; gap: 16px; }
        .hdr-burger { display: none; }
        .hdr-date   { display: inline; }
        .hdr-search { width: 220px; display: flex; }
        .hdr-name   { display: inline; }
        @media (max-width: 880px) {
          .hdr        { padding: 0 14px; gap: 8px; }
          .hdr-burger { display: flex !important; }
          .hdr-date   { display: none; }
          .hdr-search { display: none; }
          .hdr-name   { display: none; }
        }
      `}</style>
      <header className="hdr" style={{
        height: 58,
        background: '#ffffff',
        borderBottom: '1px solid #d1fae5',
        display: 'flex', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Hamburger */}
        <button onClick={onMenuClick} className="hdr-burger" style={{
          display: 'none', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8,
          background: '#f0fdf4', border: '1px solid #d1fae5',
          cursor: 'pointer', flexShrink: 0,
        }}>
          <Menu size={17} color="#0f2817" />
        </button>

        <div style={{ fontWeight: 800, fontSize: 15, color: '#0f2817', letterSpacing: -0.3 }}>{title}</div>
        <div className="hdr-date" style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>{today}</div>
        <div style={{ flex: 1 }} />

        {/* Search */}
        <div className="hdr-search" style={{
          alignItems: 'center', gap: 8,
          background: '#f0fdf4', border: '1px solid #d1fae5',
          borderRadius: 8, padding: '7px 14px',
        }}>
          <Search size={13} color="#9ca3af" />
          <input placeholder="Search…" style={{
            background: 'none', border: 'none', color: '#0f2817', fontSize: 12, width: '100%', outline: 'none',
          }} />
        </div>

        {/* Bell */}
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: '#f0fdf4', border: '1px solid #d1fae5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', flexShrink: 0,
        }}>
          <Bell size={15} color="#9ca3af" />
          <div style={{
            position: 'absolute', top: 7, right: 8,
            width: 6, height: 6, borderRadius: '50%', background: '#16a34a',
          }} />
        </div>

        {/* User */}
        <div ref={dropRef} style={{ position: 'relative', flexShrink: 0 }}>
          <div onClick={() => setOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#f0fdf4', border: '1px solid #d1fae5',
            borderRadius: 9, padding: '5px 12px 5px 6px', cursor: 'pointer',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', background: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>{initial}</div>
            <span className="hdr-name" style={{ fontSize: 12, fontWeight: 700, color: '#0f2817' }}>{display}</span>
            <ChevronDown size={12} color="#9ca3af" />
          </div>
          {open && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 6, minWidth: 200,
              background: '#fff', border: '1px solid #d1fae5', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden',
            }}>
              {vendor && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0fdf4' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f2817' }}>{vendor.shopName}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>+91 {vendor.phone}</div>
                </div>
              )}
              <button onClick={logout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', background: 'none', border: 'none',
                fontSize: 12, fontWeight: 600, color: '#dc2626', cursor: 'pointer', textAlign: 'left',
              }}>
                <LogOut size={13} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
