'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, KeyRound, Zap, ArrowRight } from 'lucide-react';

const GREEN = '#16a34a';
const DARK  = '#0f2817';

export default function VendorLogin() {
  const router = useRouter();
  const [step,    setStep]    = useState<'phone' | 'otp'>('phone');
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const sendOtp = () => {
    if (phone.length < 10) { setError('Enter a valid 10-digit phone'); return; }
    setError(''); setStep('otp');
  };

  const verify = async () => {
    setLoading(true); setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }

    localStorage.setItem('swiq_vendor', JSON.stringify(data.vendor));
    router.push('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(15,40,23,0.08)', width: '100%', maxWidth: 420, padding: '36px 32px', border: '1px solid #d1fae5' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(22,163,74,0.4)' }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <div style={{ fontWeight: 900, fontSize: 22, color: DARK, letterSpacing: -0.6 }}>Swiq</div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>
          Vendor Login
        </div>

        {step === 'phone' ? (
          <>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Phone Number</label>
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <Phone size={15} color="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="tel" inputMode="numeric" maxLength={10}
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                style={{ width: '100%', padding: '13px 14px 13px 40px', borderRadius: 10, border: '1px solid #d1fae5', fontSize: 14, color: DARK, outline: 'none', boxSizing: 'border-box' }}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
              />
            </div>

            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>{error}</div>}

            <button onClick={sendOtp} style={{ width: '100%', padding: '13px', borderRadius: 11, background: GREEN, color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(22,163,74,0.35)' }}>
              Send OTP <ArrowRight size={15} />
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
                style={{ width: '100%', padding: '13px 14px 13px 40px', borderRadius: 10, border: '1px solid #d1fae5', fontSize: 18, fontWeight: 700, letterSpacing: 4, color: DARK, outline: 'none', boxSizing: 'border-box', textAlign: 'center' }}
                onKeyDown={e => e.key === 'Enter' && verify()}
              />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 16 }}>Demo OTP: <strong style={{ color: GREEN }}>1234</strong></div>

            {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>{error}</div>}

            <button onClick={verify} disabled={loading || otp.length < 4} style={{ width: '100%', padding: '13px', borderRadius: 11, background: loading || otp.length < 4 ? '#86efac' : GREEN, color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: loading || otp.length < 4 ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? 'Verifying…' : 'Login as Vendor'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
