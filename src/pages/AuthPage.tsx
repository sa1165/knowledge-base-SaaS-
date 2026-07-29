import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, Users, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

type Tab = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (tab === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          navigate('/app');
        }
      } else {
        const { error } = await signUpWithEmail(email, password, name.trim() || email.split('@')[0]);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Account created successfully! Checking session...');
          setTimeout(() => navigate('/app'), 1000);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) setErrorMsg(error.message);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Google sign in failed.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#fbfbfa', overflowX: 'hidden' }}>

      {/* ── LEFT PANE (DARK SIDEBAR) ─────────────────────────── */}
      <div style={{
        width: '38%',
        background: '#121214',
        borderRight: '1px solid #28282c',
        padding: '48px',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }} className="hidden lg:flex">
        
        {/* Top: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#121214" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h10M7 12h10M7 17h10" />
            </svg>
          </div>
          <span className="font-serif" style={{ fontWeight: 700, fontSize: 20, color: '#ffffff', letterSpacing: '-0.01em' }}>
            DocMind
          </span>
        </div>

        {/* Middle: Content */}
        <div style={{ maxWidth: 360, margin: 'auto 0' }}>
          <h2 className="font-serif" style={{
            fontSize: 'clamp(32px, 3.8vw, 44px)', fontWeight: 400,
            lineHeight: 1.15, color: '#ffffff', marginBottom: 24, letterSpacing: '-0.01em'
          }}>
            Knowledge that comes with receipts.
          </h2>
          
          <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#8e8e93', marginBottom: 40 }}>
            Every answer cites its source. Your team can trace any claim back to the exact document and page it came from.
          </p>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} color="#8e8e93" />
              </div>
              <span style={{ fontSize: 13.5, color: '#ffffff', fontWeight: 500 }}>Source-grounded answers only</span>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} color="#8e8e93" />
              </div>
              <span style={{ fontSize: 13.5, color: '#ffffff', fontWeight: 500 }}>Indexed and searchable in seconds</span>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={14} color="#8e8e93" />
              </div>
              <span style={{ fontSize: 13.5, color: '#ffffff', fontWeight: 500 }}>Shared workspaces for the whole team</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ fontSize: 12, color: '#5e5e62' }}>
          © 2026 DocMind Inc. All rights reserved.
        </div>

      </div>

      {/* ── RIGHT PANE (FORM CONTENT) ────────────────────────── */}
      <div style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 24px',
        position: 'relative'
      }}>
        
        {/* Mobile Header Logo */}
        <div style={{ position: 'absolute', top: 24, left: 24 }} className="flex lg:hidden">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#16161a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h10M7 12h10M7 17h10" />
              </svg>
            </div>
            <span className="font-serif" style={{ fontWeight: 700, fontSize: 17, color: '#16161a' }}>DocMind</span>
          </div>
        </div>

        {/* Back Link */}
        <button onClick={() => navigate('/')} style={{
          position: 'absolute', top: 24, right: 24, background: 'none', border: 'none',
          color: '#8e8e93', fontSize: 13, fontWeight: 500, cursor: 'pointer'
        }}>
          ← Back to home
        </button>

        {/* Form Container */}
        <div style={{ width: '100%', maxWidth: 400 }}>
          
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: '#16161a', marginBottom: 8 }}>
              {tab === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p style={{ fontSize: 14, color: '#5e5e62' }}>
              {tab === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => { setTab('register'); setErrorMsg(null); }} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => { setTab('login'); setErrorMsg(null); }} style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fca5a5',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#991b1b', marginBottom: 20
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, background: '#ecfdf5', border: '1px solid #a7f3d0',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#065f46', marginBottom: 20
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignIn}
            type="button"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: '#ffffff', border: '1px solid #e5e5e3', borderRadius: 8, padding: '12px 16px',
              fontSize: 14, fontWeight: 600, color: '#161618', cursor: 'pointer', marginBottom: 24,
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: '#eaeaea' }} />
            <span style={{ fontSize: 11, color: '#8e8e93', fontFamily: 'monospace', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#eaeaea' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {tab === 'register' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#16161a', marginBottom: 6 }}>Full Name</label>
                  <input
                    type="text" placeholder="John Doe" required
                    value={name} onChange={e => setName(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8, background: '#ffffff',
                      border: '1px solid #e5e5e3', outline: 'none', fontSize: 14, color: '#16161a'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#16161a', marginBottom: 6 }}>Email address</label>
                <input
                  type="email" placeholder="sarah@acme.com" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 8, background: '#ffffff',
                    border: '1px solid #e5e5e3', outline: 'none', fontSize: 14, color: '#16161a'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#16161a' }}>Password</label>
                  {tab === 'login' && (
                    <button type="button" style={{ fontSize: 12, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'monospace' }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', paddingRight: 40, borderRadius: 8, background: '#ffffff',
                      border: '1px solid #e5e5e3', outline: 'none', fontSize: 14, color: '#16161a'
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer',
                    display: 'flex', alignItems: 'center'
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading} style={{
                width: '100%', background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 8,
                padding: '12px 16px', fontSize: 14, fontWeight: 600, cursor: isLoading ? 'default' : 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
                opacity: isLoading ? 0.7 : 1
              }}>
                {isLoading ? 'Please wait...' : tab === 'login' ? 'Sign in' : 'Create account'}
                {!isLoading && <ArrowRight size={16} />}
              </button>

            </div>
          </form>

        </div>

      </div>

    </div>
  );
};
