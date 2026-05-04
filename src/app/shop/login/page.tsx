'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, KeyRound, ArrowRight, ChefHat } from 'lucide-react';

const GREEN = '#16a34a';
const DARK  = '#0f2817';

export default function CustomerLogin() {
  const router = useRouter();
  const [step,    setStep]    = useState<'phone' | 'otp'>('phone');
  const [phone,   setPhone]   = useState('');
  const [name,    setName]    = useState('');
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const sendOtp = () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit phone'); return; }
    if (!name.trim())      { setError('Enter your name'); return; }
    setError(''); setStep('otp');
  };

  const verify = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, role: 'customer' }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }

    localStorage.setItem('swiq_customer', JSON.stringify({ phone, name: name.trim() }));
    router.push('/shop');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, #14532d 100%)`, padding: '40px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(22,163,74,0.2)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(22,163,74,0.15)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(22,163,74,0.25)', border: '1px solid rgba(22,163,74,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <ChefHat size={28} color="#a7f3d0" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: -0.6, marginBottom: 6 }}>Welcome to Swiq</div>
          <div style={{ fontSize: 13, color: '#a7f3d0' }}>Login to order & track your food</div>
        </div>
      </div>

      {/* Card */}
      <div style={{ flex: 1, padding: '0 18px', marginTop: -36 }}>
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 10px 40px rgba(15,40,23,0.08)', padding: '24px 22px', border: '1px solid #d1fae5' }}>

          {step === 'phone' ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Your Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="What should we call you?"
                  style={{ width: '100%', padding: '13px 14px', borderRadius: 11, border: '1px solid #d1fae5', fontSize: 14, color: DARK, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Phone Number</label>
              <div style={{ position: 'relative', marginBottom: 18 }}>
                <Phone size={15} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel" inputMode="numeric" maxLength={10}
                  value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit number"
                  style={{ width: '100%', padding: '13px 14px 13px 40px', borderRadius: 11, border: '1px solid #d1fae5', fontSize: 14, color: DARK, outline: 'none', boxSizing: 'border-box' }}
                  onKeyDown={e => e.key === 'Enter' && sendOtp()}
                />
              </div>

              {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>{error}</div>}

              <button onClick={sendOtp} style={{ width: '100%', padding: '14px', borderRadius: 12, background: GREEN, color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
                Send OTP <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <div style={{ background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: '#374151' }}>
                OTP sent to <strong style={{ color: DARK }}>+91 {phone}</strong>
                <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} style={{ marginLeft: 8, background: 'none', border: 'none', color: GREEN, fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Change</button>
              </div>

              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Enter OTP</label>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <KeyRound size={15} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text" inputMode="numeric" maxLength={4} autoFocus
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: 11, border: '1px solid #d1fae5', fontSize: 20, fontWeight: 700, letterSpacing: 5, color: DARK, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                  onKeyDown={e => e.key === 'Enter' && verify()}
                />
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>Demo OTP: <strong style={{ color: GREEN }}>1234</strong></div>

              {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>{error}</div>}

              <button onClick={verify} disabled={loading || otp.length < 4} style={{ width: '100%', padding: '14px', borderRadius: 12, background: loading || otp.length < 4 ? '#86efac' : GREEN, color: '#fff', fontWeight: 800, fontSize: 15, border: 'none', cursor: loading || otp.length < 4 ? 'wait' : 'pointer' }}>
                {loading ? 'Verifying…' : 'Login & Order Food'}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
          Are you a vendor? <Link href="/login" style={{ color: GREEN, fontWeight: 700, textDecoration: 'none' }}>Vendor Login →</Link>
        </div>
      </div>
    </div>
  );
}
