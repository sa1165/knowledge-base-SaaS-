import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';

interface FeatureItem {
  text: string;
  available: boolean;
}

interface Plan {
  key: string;
  name: string;
  priceMonthly: string;
  priceYearly: string;
  period: string;
  desc: string;
  cta: string;
  popular: boolean;
  features: FeatureItem[];
}

const PLANS: Plan[] = [
  {
    key: 'free',
    name: 'FREE',
    priceMonthly: '$0',
    priceYearly: '$0',
    period: 'forever, no card needed',
    desc: 'Basic workspace search tools.',
    cta: 'Start for free',
    popular: false,
    features: [
      { text: '3 workspaces', available: true },
      { text: '50 documents', available: true },
      { text: '500 queries / month', available: true },
      { text: '1 team member', available: true },
      { text: 'Custom integrations', available: false },
      { text: 'Audit logs', available: false },
      { text: 'SSO / SAML', available: false },
    ]
  },
  {
    key: 'pro',
    name: 'TEAM',
    priceMonthly: '$12',
    priceYearly: '$10', // 20% discount of 12 is ~9.6, let's say $10
    period: '/user/mo',
    desc: 'For teams that need document intelligence.',
    cta: 'Get started',
    popular: true,
    features: [
      { text: 'Unlimited workspaces', available: true },
      { text: '1,000 documents', available: true },
      { text: '10,000 queries / month', available: true },
      { text: 'Up to 25 members', available: true },
      { text: 'Custom integrations', available: true },
      { text: 'Audit logs', available: true },
      { text: 'SSO / SAML', available: false },
    ]
  },
  {
    key: 'enterprise',
    name: 'ENTERPRISE',
    priceMonthly: 'Custom',
    priceYearly: 'Custom',
    period: 'contact sales',
    desc: 'Enterprise security and scale.',
    cta: 'Contact sales',
    popular: false,
    features: [
      { text: 'Everything in Team', available: true },
      { text: 'Unlimited documents', available: true },
      { text: 'Unlimited queries', available: true },
      { text: 'Unlimited members', available: true },
      { text: 'SSO / SAML', available: true },
      { text: 'Dedicated SLA', available: true },
      { text: 'On-premise option', available: true },
    ]
  }
];

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelect = (planKey: string) => {
    if (planKey === 'free') navigate('/app');
    else if (planKey === 'pro') navigate('/payment');
    else alert('Contact our sales team at sales@docmind.io for Enterprise pricing.');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fbfbfa', color: '#161618', overflowX: 'hidden' }}>
      
      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        background: 'rgba(251, 251, 250, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #eaeaea',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#16161a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h10M7 12h10M7 17h10" />
              </svg>
            </div>
            <span className="font-serif" style={{ fontWeight: 700, fontSize: 20, color: '#16161a', letterSpacing: '-0.01em' }}>
              DocMind
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate('/auth')} style={{
              background: 'none', border: 'none', color: '#16161a', cursor: 'pointer', fontSize: 14, fontWeight: 600
            }}>
              Sign in
            </button>
            <button onClick={() => navigate('/auth')} style={{
              background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Get started
            </button>
          </div>

        </div>
      </nav>

      {/* ── PRICING SECTION ───────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '70px 24px 100px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: '#8e8e93', fontFamily: 'monospace', marginBottom: 12 }}>
            PRICING
          </div>
          <h1 className="font-serif" style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 400, color: '#16161a', marginBottom: 24, letterSpacing: '-0.01em' }}>
            Simple, transparent pricing
          </h1>

          {/* Billing Switcher Toggle */}
          <div style={{
            display: 'inline-flex', background: '#eaeaea',
            borderRadius: 12, padding: '4px', gap: 4, border: '1px solid #e0e0e0'
          }}>
            <button 
              onClick={() => setBillingPeriod('monthly')} 
              style={{
                padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: billingPeriod === 'monthly' ? '#ffffff' : 'transparent',
                color: billingPeriod === 'monthly' ? '#16161a' : '#8e8e93',
                boxShadow: billingPeriod === 'monthly' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod('yearly')} 
              style={{
                padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: billingPeriod === 'yearly' ? '#ffffff' : 'transparent',
                color: billingPeriod === 'yearly' ? '#16161a' : '#8e8e93',
                boxShadow: billingPeriod === 'yearly' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              Annual
              <span style={{
                fontSize: 10, background: '#dcfce7', color: '#166534',
                padding: '1px 6px', borderRadius: 4, border: '1px solid #bbf7d0', fontWeight: 700
              }}>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 24, alignItems: 'stretch' }}>
          {PLANS.map(plan => {
            const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            
            return (
              <div
                key={plan.key}
                style={{
                  borderRadius: 20, padding: 36,
                  border: plan.popular ? '1px solid #16161a' : '1px solid #e5e5e3',
                  background: plan.popular ? '#121214' : '#ffffff',
                  color: plan.popular ? '#ffffff' : '#161618',
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  boxShadow: plan.popular ? '0 20px 48px rgba(0,0,0,0.12)' : '0 8px 24px rgba(0,0,0,0.02)',
                  transform: plan.popular ? 'scale(1.02)' : 'none'
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <span style={{
                    position: 'absolute', top: 20, right: 20,
                    background: '#2563eb', color: '#ffffff', fontSize: 11, fontWeight: 700,
                    borderRadius: 100, padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    Most popular
                  </span>
                )}

                <div>
                  {/* Plan Name */}
                  <span style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                    color: plan.popular ? '#8e8e93' : '#8e8e93', display: 'block', marginBottom: 24
                  }}>
                    {plan.name}
                  </span>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span className="font-serif" style={{ fontSize: 54, fontWeight: 400, letterSpacing: '-0.02em' }}>
                      {price}
                    </span>
                    <span style={{ fontSize: 13, color: plan.popular ? '#8e8e93' : '#5e5e62' }}>
                      {plan.period}
                    </span>
                  </div>
                  
                  {/* Desc */}
                  <p style={{ fontSize: 13.5, color: plan.popular ? '#8e8e93' : '#5e5e62', marginBottom: 32, lineHeight: 1.5 }}>
                    {plan.desc}
                  </p>

                  <div style={{ height: 1, background: plan.popular ? '#28282c' : '#eaeaea', marginBottom: 32 }} />

                  {/* Features Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
                    {plan.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {feat.available ? (
                          <Check size={16} color="#10b981" strokeWidth={3} />
                        ) : (
                          <X size={16} color={plan.popular ? '#5e5e62' : '#c1c1c4'} strokeWidth={3} />
                        )}
                        <span style={{
                          fontSize: 13.5,
                          color: feat.available 
                            ? (plan.popular ? '#ffffff' : '#161618') 
                            : (plan.popular ? '#5e5e62' : '#8e8e93'),
                          textDecoration: !feat.available ? 'line-through' : 'none'
                        }}>
                          {feat.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelect(plan.key)}
                  style={{
                    width: '100%',
                    background: plan.popular ? '#ffffff' : '#16161a',
                    color: plan.popular ? '#16161a' : '#ffffff',
                    border: 'none', borderRadius: 8, padding: '12px 24px',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {plan.cta}
                </button>

              </div>
            );
          })}
        </div>

        {/* Info bottom banner */}
        <div style={{ textAlign: 'center', marginTop: 80, padding: '40px 0 0', borderTop: '1px solid #eaeaea' }}>
          <p style={{ fontSize: 13.5, color: '#8e8e93' }}>
            All plans include a 14-day free trial • Cancel or upgrade anytime • Secure payment via Stripe
          </p>
        </div>

      </div>

    </div>
  );
};
