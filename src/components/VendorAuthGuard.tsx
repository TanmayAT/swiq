'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VendorAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('swiq_vendor');
    if (!raw) { router.replace('/login'); return; }
    try {
      const v = JSON.parse(raw);
      if (!v?.isActive) { localStorage.removeItem('swiq_vendor'); router.replace('/login'); return; }
      setOk(true);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  if (!ok) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 13, color: '#9ca3af' }}>
      Checking session…
    </div>
  );
  return <>{children}</>;
}
