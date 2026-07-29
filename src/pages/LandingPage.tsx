import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, 
  ArrowRight, 
  UploadCloud, 
  MessageSquare, 
  ShieldCheck, 
  Shield, 
  Layers, 
  Users, 
  Cpu, 
  Lock, 
  TrendingUp,
  FileText,
  CheckCircle2,
  Check
} from 'lucide-react';
import ThreeDCard from '../components/ThreeDCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#fbfbfa', minHeight: '100vh', color: '#161618', overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 100,
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
              Docly
            </span>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
            <a href="#features" style={{ color: '#5e5e62', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
            <a href="#how-it-works" style={{ color: '#5e5e62', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>How it works</a>
            <button onClick={() => navigate('/pricing')} style={{ background: 'none', border: 'none', color: '#5e5e62', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Pricing</button>
            <a href="#docs" style={{ color: '#5e5e62', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Docs</a>
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
              transition: 'background 0.2s',
            }} onMouseOver={(e) => e.currentTarget.style.background = '#2c2c30'}
               onMouseOut={(e) => e.currentTarget.style.background = '#16161a'}>
              Get started
            </button>
          </div>

        </div>
      </nav>

      {/* ── HERO SECTION ─────────────────────────────────── */}
      <section style={{ padding: '80px 24px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          
          {/* Hero Content */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            
            {/* Citation Tagline */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#edf4fc', border: '1px solid #cce0f5',
              borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 500,
              color: '#3b82f6', marginBottom: 28, fontFamily: 'monospace'
            }}>
              <span style={{ fontSize: 12 }}>⚡</span>
              Every answer cites the exact source
            </div>

            {/* Main Headline */}
            <h1 className="font-serif" style={{
              fontSize: 'clamp(42px, 5.5vw, 68px)', fontWeight: 400,
              lineHeight: 1.08, color: '#16161a', marginBottom: 28, letterSpacing: '-0.02em'
            }}>
              The knowledge base your team actually trusts.
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: 17, lineHeight: 1.6, color: '#5e5e62', marginBottom: 36, maxWidth: 520 }}>
              Upload your documents. Ask any question. Every answer is grounded in real sources — with precise citations your team can verify in one click.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%', marginBottom: 16 }}>
              <button onClick={() => navigate('/auth')} style={{
                background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 8,
                padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s'
              }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'none'}>
                Start for free <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/pricing')} style={{
                background: '#f1f1f0', color: '#16161a', border: '1px solid #e5e5e3', borderRadius: 8,
                padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s'
              }} onMouseOver={(e) => e.currentTarget.style.background = '#e9e9e8'}
                 onMouseOut={(e) => e.currentTarget.style.background = '#f1f1f0'}>
                See a live demo
              </button>
            </div>

            {/* Pricing Info */}
            <span style={{ fontSize: 12, color: '#8e8e93', letterSpacing: '0.01em', marginLeft: 4 }}>
              No credit card required · 14-day trial on paid plans
            </span>
          </div>

          {/* Hero Visual - Premium Mock Chat */}
          <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ThreeDCard>
            <div style={{
              background: '#f4f4f3', border: '1px solid #e2e0e0', borderRadius: 16,
              width: '100%', maxWidth: 540, boxShadow: '0 24px 60px -15px rgba(0,0,0,0.06)',
              overflow: 'hidden', padding: '16px 20px 24px'
            }}>
              
              {/* Window Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid #e8e8e6', paddingBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                </div>
                <span style={{ fontSize: 12, color: '#8e8e93', fontWeight: 500, fontFamily: 'monospace' }}>
                  TechCorp Due Diligence · Chat
                </span>
                <span style={{ width: 32 }} />
              </div>

              {/* User Question */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <div style={{
                  background: '#16161a', color: '#ffffff', borderRadius: '16px 16px 4px 16px',
                  padding: '12px 18px', maxWidth: '85%', fontSize: 13.5, lineHeight: 1.5,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}>
                  What are TechCorp's key IP holdings?
                </div>
              </div>

              {/* AI Answer Card */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, background: '#e0ebf9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                </div>
                <div style={{
                  background: '#edf4fc', border: '1px solid #cce0f5', borderRadius: '4px 16px 16px 16px',
                  padding: '16px 20px', fontSize: 13.5, color: '#1a2b49', lineHeight: 1.6, flexGrow: 1
                }}>
                  TechCorp holds <strong style={{ color: '#0f172a' }}>23 active patents</strong> across three domains: edge computing (14), ML inference optimization (6), and lossless compression (3).
                  
                  {/* Sources tags container */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff',
                      border: '1px solid #dbeafe', borderRadius: 6, padding: '4px 8px',
                      fontSize: 11, color: '#2563eb', fontWeight: 500, cursor: 'pointer'
                    }}>
                      <FileText size={11} /> IP_Portfolio.pdf p.7
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff',
                      border: '1px solid #dbeafe', borderRadius: 6, padding: '4px 8px',
                      fontSize: 11, color: '#2563eb', fontWeight: 500, cursor: 'pointer'
                    }}>
                      <FileText size={11} /> AnnualReport_2023.pdf p.34
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Floating Widget (Lower Right overlay effect) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <div style={{
                  background: '#ffffff', border: '1px solid #e5e5e3', borderRadius: 12,
                  padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#ecfdf5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Check size={12} color="#10b981" strokeWidth={3} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#16161a' }}>IP_Portfolio.pdf</div>
                    <div style={{ fontSize: 10, color: '#8e8e93' }}>38 pages · Indexed</div>
                  </div>
                </div>
              </div>

            </div>
            </ThreeDCard>
          </div>

        </div>
      </section>

      {/* ── HOW IT WORKS SECTION ───────────────────────────── */}
      <section id="how-it-works" style={{ padding: '100px 24px', borderTop: '1px solid #eaeaea', background: '#fcfcfb' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: '#8e8e93', fontFamily: 'monospace' }}>
              HOW IT WORKS
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#16161a', marginTop: 10 }}>
              From document to verified answer in under a minute
            </h2>
          </div>

          {/* Three steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40 }}>
            
            {/* Step 1 */}
            <div>
              <div className="font-serif" style={{ fontSize: 48, fontWeight: 300, color: '#e5e5e3', marginBottom: -10 }}>01</div>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: '#16161a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <UploadCloud size={20} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#16161a', marginBottom: 12 }}>Upload your documents</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5e5e62' }}>
                PDFs, Word docs, presentations — drag them in. Docly processes, chunks, and indexes every page automatically. Watch status update in real time.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <div className="font-serif" style={{ fontSize: 48, fontWeight: 300, color: '#e5e5e3', marginBottom: -10 }}>02</div>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: '#16161a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <MessageSquare size={20} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#16161a', marginBottom: 12 }}>Ask in plain language</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5e5e62' }}>
                Natural questions, complex comparisons, cross-document synthesis. The AI reads across your entire workspace and drafts a grounded response.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <div className="font-serif" style={{ fontSize: 48, fontWeight: 300, color: '#e5e5e3', marginBottom: -10 }}>03</div>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: '#16161a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <ShieldCheck size={20} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#16161a', marginBottom: 12 }}>Verify every claim</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#5e5e62' }}>
                Each answer links to the exact passage and page number. One click expands the source excerpt inline — no tab-switching required.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── TRUST & FEATURES SECTION (DARK BACKDROP) ──────── */}
      <section id="features" style={{ padding: '100px 24px', background: '#121214', color: '#ffffff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: '#ffffff' }}>
              Built for trust, not novelty
            </h2>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 1 }}>
            
            {/* Feature 1 */}
            <div style={{ padding: '32px', background: '#1a1a1e', border: '1px solid #28282c' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Shield size={18} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>Source-grounded answers</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8e8e93' }}>
                The AI cannot hallucinate citations — every claim is anchored to a real passage in a real document.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ padding: '32px', background: '#1a1a1e', border: '1px solid #28282c' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Layers size={18} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>Workspace isolation</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8e8e93' }}>
                Documents in one workspace are never surfaced in another. Strict per-workspace retrieval boundaries.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{ padding: '32px', background: '#1a1a1e', border: '1px solid #28282c' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Users size={18} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>Granular permissions</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8e8e93' }}>
                Owners control who can upload, delete, or query. Viewer-only accounts can read answers but can't modify the library.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{ padding: '32px', background: '#1a1a1e', border: '1px solid #28282c' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Cpu size={18} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>RAG with chunk context</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8e8e93' }}>
                Retrieval uses dense semantic search over document chunks, with overlapping context windows to preserve meaning.
              </p>
            </div>

            {/* Feature 5 */}
            <div style={{ padding: '32px', background: '#1a1a1e', border: '1px solid #28282c' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Lock size={18} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>Encrypted at rest</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8e8e93' }}>
                All documents and embeddings are AES-256 encrypted at rest. SOC 2 Type II certified.
              </p>
            </div>

            {/* Feature 6 */}
            <div style={{ padding: '32px', background: '#1a1a1e', border: '1px solid #28282c' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <TrendingUp size={18} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginBottom: 10 }}>Usage analytics</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: '#8e8e93' }}>
                See which documents get queried most, which questions go unanswered, and where knowledge gaps exist.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ padding: '60px 24px', borderTop: '1px solid #eaeaea', background: '#fbfbfa', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, background: '#16161a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 7h10M7 12h10M7 17h10" />
            </svg>
          </div>
          <span className="font-serif" style={{ fontWeight: 700, fontSize: 17, color: '#16161a' }}>
            Docly
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#8e8e93' }}>© 2026 Docly Inc. Built for high-reliability enterprise document search.</p>
      </footer>

    </div>
  );
};
