'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import VendorAuthGuard from './VendorAuthGuard';

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <VendorAuthGuard>
      <style>{`
        .shell-content { margin-left: 220px; }
        .shell-main    { padding: 24px 28px; }
        .shell-backdrop { display: none; }
        @media (max-width: 880px) {
          .shell-content { margin-left: 0 !important; }
          .shell-main    { padding: 14px 12px !important; }
          .shell-backdrop {
            display: block; position: fixed; inset: 0;
            background: rgba(0,0,0,0.45); z-index: 49;
          }
        }
      `}</style>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f0fdf4' }}>
        <Sidebar open={open} onClose={() => setOpen(false)} />
        {open && <div className="shell-backdrop" onClick={() => setOpen(false)} />}
        <div className="shell-content" style={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          minHeight: '100vh', background: '#f0fdf4',
          minWidth: 0,
        }}>
          <Header onMenuClick={() => setOpen(o => !o)} />
          <main className="shell-main" style={{
            flex: 1, background: '#f0fdf4', overflowY: 'auto',
          }}>
            {children}
          </main>
        </div>
      </div>
    </VendorAuthGuard>
  );
}
