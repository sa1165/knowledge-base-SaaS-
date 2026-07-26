import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type CardSide = 'front' | 'back';

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return digits;
}

export const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [activeField, setActiveField] = useState<CardSide>('front');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const displayNumber = cardNumber || '•••• •••• •••• ••••';
  const displayName = cardName || 'YOUR NAME';
  const displayExpiry = expiry || 'MM / YY';
  const displayCvv = cvv || '•••';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 2200));
    setIsLoading(false);
    setIsSuccess(true);
    await new Promise(r => setTimeout(r, 2000));
    navigate('/app');
  };

  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, animation: 'scale-in 0.5s ease-out', boxShadow: '0 0 60px rgba(16,185,129,0.5)' }}>
          ✓
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', animation: 'fade-up 0.5s ease-out 0.2s both' }}>Payment Successful!</h2>
        <p style={{ color: '#64748b', animation: 'fade-up 0.5s ease-out 0.3s both' }}>Redirecting to your Pro dashboard…</p>
        <div style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', animation: 'fade-up 0.5s ease-out 0.4s both' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', animation: 'shimmer 2s ease-out forwards', width: '100%', transformOrigin: 'left' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      <div style={{ position: 'absolute', width: 500, height: 500, top: -150, right: -150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, bottom: -100, left: -100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Nav */}
      <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/pricing')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>Nova<span style={{ color: '#818cf8' }}>RAG</span></span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
            <span>🔒</span> Secured by SSL / TLS
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

        {/* Left: Card preview + form */}
        <div style={{ animation: 'fade-up 0.6s ease-out' }}>
          <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Payment Details</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 32 }}>Pro Plan — $49/mo</h1>

          {/* 3D Credit Card */}
          <div className="credit-card-scene" style={{ margin: '0 auto 36px' }}>
            <div className={`credit-card-inner ${activeField === 'back' ? 'flipped' : ''}`}>
              {/* Front */}
              <div className="credit-card-face credit-card-front">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 26 }}>⚡</div>
                  <div style={{ fontSize: 32, fontStyle: 'italic', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>VISA</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 22, letterSpacing: 3, color: '#fff', marginBottom: 16 }}>
                    {displayNumber}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Card Holder</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>{displayName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Expires</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>{displayExpiry}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="credit-card-face credit-card-back">
                <div style={{ height: 40, background: 'rgba(0,0,0,0.5)', margin: '-24px -24px 20px', borderRadius: '20px 20px 0 0' }} />
                <div style={{ background: 'rgba(255,255,255,0.12)', height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', paddingRight: 12, justifyContent: 'flex-end' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 18, color: '#fff', letterSpacing: 4 }}>{cvv || '•••'}</div>
                </div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 'auto', lineHeight: 1.5 }}>
                  This card is issued by NovaRAG Financial Services. Your security is our priority.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Cardholder Name</label>
                <input
                  className="form-input" placeholder="John Doe" value={cardName}
                  onChange={e => setCardName(e.target.value.toUpperCase())}
                  onFocus={() => setActiveField('front')} required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Card Number</label>
                <input
                  className="form-input" placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  onFocus={() => setActiveField('front')}
                  style={{ fontFamily: 'monospace', letterSpacing: 2 }}
                  required maxLength={19}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Expiry Date</label>
                  <input
                    className="form-input" placeholder="MM / YY" value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    onFocus={() => setActiveField('front')} required maxLength={7}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>CVV</label>
                  <input
                    className="form-input" placeholder="•••" type="password" value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    onFocus={() => setActiveField('back')}
                    onBlur={() => setActiveField('front')}
                    required maxLength={3} style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 15, padding: '14px', opacity: isLoading ? 0.7 : 1 }} disabled={isLoading}>
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin-slow 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                    Processing Payment…
                  </span>
                ) : '🔒 Pay $49.00 — Activate Pro'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 12, color: '#374151' }}>
                Your payment is secured with 256-bit SSL encryption. Cancel anytime.
              </p>
            </div>
          </form>
        </div>

        {/* Right: Order summary */}
        <div style={{ animation: 'fade-up 0.6s ease-out 0.15s both' }}>
          <div className="glass" style={{ borderRadius: 20, padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Order Summary</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>NovaRAG Pro</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Monthly subscription</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>$49.00</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Subtotal', value: '$49.00' },
                { label: 'Tax (0%)', value: '$0.00' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800, color: '#fff', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <span>Total Today</span>
              <span>$49.00</span>
            </div>
          </div>

          {/* Pro Features */}
          <div className="glass-light" style={{ borderRadius: 20, padding: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 14 }}>What's Included in Pro</h4>
            {[
              '5 Workspaces',
              '50 Documents / workspace',
              '2,500 RAG queries / month',
              'Full RBAC permissions',
              'Redis query caching',
              'RAG evaluation harness',
              'Priority support',
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
                  <span style={{ color: '#818cf8' }}>✓</span>
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
