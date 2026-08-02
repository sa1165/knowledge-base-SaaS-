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
import ThreeDConstellation from '../components/ThreeDConstellation';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Mouse move handler for spotlight effect on feature cards
  const handleMouseMoveFeature = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
  };

  return (
    <div style={{ background: '#fbfbfa', minHeight: '100vh', color: '#161618', overflowX: 'hidden', position: 'relative' }}>
      
      {/* Dynamic Keyframes and Animations style tag */}
      <style>{`
        @keyframes floatSpheres {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-25px) scale(1.05); }
        }
        @keyframes floatSpheres2 {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(30px) scale(0.95); }
        }
        .hero-reveal-tag {
          animation: heroReveal 1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .hero-reveal-title {
          animation: heroReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .hero-reveal-sub {
          animation: heroReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both;
        }
        .hero-reveal-cta {
          animation: heroReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
        }
        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .how-it-works-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 24px;
          border-radius: 16px;
          border: 1px solid transparent;
        }
        .how-it-works-card:hover {
          transform: translateY(-8px);
          background: #ffffff;
          border-color: #f1f1f0;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.03);
        }
        .how-it-works-card:hover .step-num {
          color: #16161a !important;
          transform: scale(1.05);
        }
        .how-it-works-card:hover .step-icon {
          background: #16161a !important;
          transform: scale(1.1) rotate(4deg);
          box-shadow: 0 8px 16px rgba(22, 22, 26, 0.12);
        }
        
        .feature-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          background: #1a1a1e;
          border: 1px solid #28282c;
          padding: 36px 32px;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(400px circle at var(--x, 0px) var(--y, 0px), rgba(99, 102, 241, 0.12), transparent 50%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 1;
        }
        .feature-card:hover::before {
          opacity: 1;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          border-color: #4f46e5 !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
        }
        .feature-card:hover .feature-icon {
          background: #4f46e5 !important;
          transform: scale(1.08);
          box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3);
        }
        .feature-card:hover .feature-icon svg {
          stroke: #ffffff !important;
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(251, 251, 250, 0.85)',
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
            <a href="#features" style={{ color: '#5e5e62', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#16161a'} onMouseOut={(e) => e.currentTarget.style.color = '#5e5e62'}>Features</a>
            <a href="#how-it-works" style={{ color: '#5e5e62', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#16161a'} onMouseOut={(e) => e.currentTarget.style.color = '#5e5e62'}>How it works</a>
            <button onClick={() => navigate('/pricing')} style={{ background: 'none', border: 'none', color: '#5e5e62', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#16161a'} onMouseOut={(e) => e.currentTarget.style.color = '#5e5e62'}>Pricing</button>
            <a href="#docs" style={{ color: '#5e5e62', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#16161a'} onMouseOut={(e) => e.currentTarget.style.color = '#5e5e62'}>Docs</a>
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
              transition: 'all 0.2s ease',
            }} onMouseOver={(e) => {
              e.currentTarget.style.background = '#2c2c30';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
               onMouseOut={(e) => {
                 e.currentTarget.style.background = '#16161a';
                 e.currentTarget.style.transform = 'none';
               }}>
              Get started
            </button>
          </div>

        </div>
      </nav>

      {/* ── HERO SECTION WITH 3D CONSTELLATION ──────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: 'calc(100vh - 65px)', display: 'flex', alignItems: 'center' }}>
        
        {/* Blurry Animated Glowing Backdrops */}
        <div style={{
          position: 'absolute', top: '15%', left: '10%', width: 450, height: 450,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0,
          animation: 'floatSpheres 14s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute', bottom: '15%', right: '5%', width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0) 70%)',
          filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0,
          animation: 'floatSpheres2 18s ease-in-out infinite'
        }} />

        {/* 3D Particle Constellation (Tracks Mouse movements) */}
        <ThreeDConstellation />

        {/* Hero Content Container */}
        <div style={{ position: 'relative', zIndex: 1, padding: '60px 24px 80px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 64, alignItems: 'center' }}>
            
            {/* Left Column: Hero Copy */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              
              {/* Citation Tagline */}
              <div className="hero-reveal-tag" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(237, 244, 252, 0.7)', border: '1px solid #cce0f5',
                backdropFilter: 'blur(10px)',
                borderRadius: 100, padding: '6px 14px', fontSize: 12, fontWeight: 500,
                color: '#3b82f6', marginBottom: 24, fontFamily: 'monospace',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.05)'
              }}>
                <span style={{ fontSize: 12 }}>⚡</span>
                Every answer cites the exact source
              </div>

              {/* Main Headline */}
              <h1 className="font-serif hero-reveal-title" style={{
                fontSize: 'clamp(42px, 5vw, 64px)', fontWeight: 400,
                lineHeight: 1.08, color: '#16161a', marginBottom: 24, letterSpacing: '-0.02em'
              }}>
                The knowledge base your team actually trusts.
              </h1>

              {/* Subtitle */}
              <p className="hero-reveal-sub" style={{ fontSize: 17, lineHeight: 1.6, color: '#5e5e62', marginBottom: 36, maxWidth: 520 }}>
                Upload your documents. Ask any question. Every answer is grounded in real sources — with precise citations your team can verify in one click.
              </p>

              {/* CTAs */}
              <div className="hero-reveal-cta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: '100%', marginBottom: 16 }}>
                <button onClick={() => navigate('/auth')} style={{
                  background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 8,
                  padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease',
                  boxShadow: '0 8px 24px rgba(22, 22, 26, 0.12)'
                }} onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = '#2c2c30';
                }}
                   onMouseOut={(e) => {
                     e.currentTarget.style.transform = 'none';
                     e.currentTarget.style.background = '#16161a';
                   }}>
                  Start for free <ArrowRight size={16} />
                </button>
                <button onClick={() => navigate('/pricing')} style={{
                  background: '#f1f1f0', color: '#16161a', border: '1px solid #e5e5e3', borderRadius: 8,
                  padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} onMouseOver={(e) => {
                  e.currentTarget.style.background = '#e9e9e8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                   onMouseOut={(e) => {
                     e.currentTarget.style.background = '#f1f1f0';
                     e.currentTarget.style.transform = 'none';
                   }}>
                  See a live demo
                </button>
              </div>

              {/* Pricing Info */}
              <span className="hero-reveal-cta" style={{ fontSize: 12, color: '#8e8e93', letterSpacing: '0.01em', marginLeft: 4 }}>
                No credit card required · 14-day trial on paid plans
              </span>
            </div>

            {/* Right Column: Hero Visual with Real Layered Parallax Effect */}
            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <ThreeDCard>
                <div style={{
                  background: '#f4f4f3', border: '1px solid #e2e0e0', borderRadius: 20,
                  width: '100%', maxWidth: 540, boxShadow: '0 30px 70px -15px rgba(0,0,0,0.08)',
                  overflow: 'hidden', padding: '20px 24px 28px',
                  transformStyle: 'preserve-3d',
                  position: 'relative'
                }}>
                  
                  {/* Window Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, borderBottom: '1px solid #e8e8e6', paddingBottom: 14 }}>
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

                  {/* User Question - Floats in 3D (translateZ 30px) */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    marginBottom: 24, 
                    transform: 'translateZ(30px)', 
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{
                      background: '#16161a', color: '#ffffff', borderRadius: '16px 16px 4px 16px',
                      padding: '12px 20px', maxWidth: '85%', fontSize: 13.5, lineHeight: 1.5,
                      boxShadow: '0 8px 20px rgba(22, 22, 26, 0.15)',
                      transform: 'translateZ(10px)'
                    }}>
                      What are TechCorp's key IP holdings?
                    </div>
                  </div>

                  {/* AI Answer Card - Floats Higher in 3D (translateZ 60px) */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 12, 
                    alignItems: 'flex-start', 
                    marginBottom: 24, 
                    transform: 'translateZ(60px)', 
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, background: '#e0ebf9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
                      transform: 'translateZ(15px)'
                    }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                    </div>
                    
                    <div style={{
                      background: '#edf4fc', border: '1px solid #cce0f5', borderRadius: '4px 20px 20px 20px',
                      padding: '16px 20px', fontSize: 13.5, color: '#1a2b49', lineHeight: 1.6, flexGrow: 1,
                      boxShadow: '0 10px 25px rgba(37, 99, 235, 0.05)',
                      transform: 'translateZ(20px)'
                    }}>
                      TechCorp holds <strong style={{ color: '#0f172a' }}>23 active patents</strong> across three domains: edge computing (14), ML inference optimization (6), and lossless compression (3).
                      
                      {/* Sources tags container */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff',
                          border: '1px solid #dbeafe', borderRadius: 6, padding: '4px 10px',
                          fontSize: 11, color: '#2563eb', fontWeight: 500, cursor: 'pointer',
                          transition: 'all 0.2s'
                        }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                           onMouseOut={(e) => e.currentTarget.style.borderColor = '#dbeafe'}>
                          <FileText size={11} /> IP_Portfolio.pdf p.7
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffffff',
                          border: '1px solid #dbeafe', borderRadius: 6, padding: '4px 10px',
                          fontSize: 11, color: '#2563eb', fontWeight: 500, cursor: 'pointer',
                          transition: 'all 0.2s'
                        }} onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                           onMouseOut={(e) => e.currentTarget.style.borderColor = '#dbeafe'}>
                          <FileText size={11} /> AnnualReport_2023.pdf p.34
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Floating Widget - Floats Highest in 3D (translateZ 90px) */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    marginTop: 12, 
                    transform: 'translateZ(90px)', 
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.2s ease'
                  }}>
                    <div style={{
                      background: '#ffffff', border: '1px solid #e5e5e3', borderRadius: 14,
                      padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12,
                      boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                      transform: 'translateZ(30px)'
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', background: '#ecfdf5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Check size={13} color="#10b981" strokeWidth={3} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#16161a' }}>IP_Portfolio.pdf</div>
                        <div style={{ fontSize: 10.5, color: '#8e8e93' }}>38 pages · Indexed</div>
                      </div>
                    </div>
                  </div>

                </div>
              </ThreeDCard>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION (WITH INTERACTIVE CARDS) ───── */}
      <section id="how-it-works" style={{ padding: '120px 24px', borderTop: '1px solid #eaeaea', background: '#fcfcfb', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: '#8e8e93', fontFamily: 'monospace' }}>
              HOW IT WORKS
            </span>
            <h2 className="font-serif" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 400, color: '#16161a', marginTop: 12 }}>
              From document to verified answer in under a minute
            </h2>
          </div>

          {/* Three steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            
            {/* Step 1 */}
            <div className="how-it-works-card">
              <div className="font-serif step-num" style={{ fontSize: 54, fontWeight: 300, color: '#e5e5e3', marginBottom: -6, transition: 'color 0.3s ease, transform 0.3s ease' }}>01</div>
              <div className="step-icon" style={{
                width: 46, height: 46, borderRadius: 12, background: '#2c2c30',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                transition: 'all 0.3s ease'
              }}>
                <UploadCloud size={22} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#16161a', marginBottom: 12 }}>Upload your documents</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#5e5e62' }}>
                PDFs, Word docs, presentations — drag them in. Docly processes, chunks, and indexes every page automatically. Watch status update in real time.
              </p>
            </div>

            {/* Step 2 */}
            <div className="how-it-works-card">
              <div className="font-serif step-num" style={{ fontSize: 54, fontWeight: 300, color: '#e5e5e3', marginBottom: -6, transition: 'color 0.3s ease, transform 0.3s ease' }}>02</div>
              <div className="step-icon" style={{
                width: 46, height: 46, borderRadius: 12, background: '#2c2c30',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                transition: 'all 0.3s ease'
              }}>
                <MessageSquare size={22} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#16161a', marginBottom: 12 }}>Ask in plain language</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#5e5e62' }}>
                Natural questions, complex comparisons, cross-document synthesis. The AI reads across your entire workspace and drafts a grounded response.
              </p>
            </div>

            {/* Step 3 */}
            <div className="how-it-works-card">
              <div className="font-serif step-num" style={{ fontSize: 54, fontWeight: 300, color: '#e5e5e3', marginBottom: -6, transition: 'color 0.3s ease, transform 0.3s ease' }}>03</div>
              <div className="step-icon" style={{
                width: 46, height: 46, borderRadius: 12, background: '#2c2c30',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                transition: 'all 0.3s ease'
              }}>
                <ShieldCheck size={22} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#16161a', marginBottom: 12 }}>Verify every claim</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#5e5e62' }}>
                Each answer links to the exact passage and page number. One click expands the source excerpt inline — no tab-switching required.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── TRUST & FEATURES SECTION WITH SPOTLIGHT ────────── */}
      <section id="features" style={{ padding: '120px 24px', background: '#121214', color: '#ffffff', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <h2 className="font-serif" style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: '#ffffff' }}>
              Built for trust, not novelty
            </h2>
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            
            {/* Feature 1 */}
            <div className="feature-card" onMouseMove={handleMouseMoveFeature}>
              <div className="feature-icon" style={{ width: 40, height: 40, borderRadius: 10, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'all 0.3s' }}>
                <Shield size={20} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>Source-grounded answers</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#8e8e93' }}>
                The AI cannot hallucinate citations — every claim is anchored to a real passage in a real document.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card" onMouseMove={handleMouseMoveFeature}>
              <div className="feature-icon" style={{ width: 40, height: 40, borderRadius: 10, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'all 0.3s' }}>
                <Layers size={20} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>Workspace isolation</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#8e8e93' }}>
                Documents in one workspace are never surfaced in another. Strict per-workspace retrieval boundaries.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card" onMouseMove={handleMouseMoveFeature}>
              <div className="feature-icon" style={{ width: 40, height: 40, borderRadius: 10, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'all 0.3s' }}>
                <Users size={20} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>Granular permissions</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#8e8e93' }}>
                Owners control who can upload, delete, or query. Viewer-only accounts can read answers but can't modify the library.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card" onMouseMove={handleMouseMoveFeature}>
              <div className="feature-icon" style={{ width: 40, height: 40, borderRadius: 10, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'all 0.3s' }}>
                <Cpu size={20} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>RAG with chunk context</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#8e8e93' }}>
                Retrieval uses dense semantic search over document chunks, with overlapping context windows to preserve meaning.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card" onMouseMove={handleMouseMoveFeature}>
              <div className="feature-icon" style={{ width: 40, height: 40, borderRadius: 10, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'all 0.3s' }}>
                <Lock size={20} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>Encrypted at rest</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#8e8e93' }}>
                All documents and embeddings are AES-256 encrypted at rest. SOC 2 Type II certified.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="feature-card" onMouseMove={handleMouseMoveFeature}>
              <div className="feature-icon" style={{ width: 40, height: 40, borderRadius: 10, background: '#2c2c30', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, transition: 'all 0.3s' }}>
                <TrendingUp size={20} color="#8e8e93" />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#ffffff', marginBottom: 12 }}>Usage analytics</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#8e8e93' }}>
                See which documents get queried most, which questions go unanswered, and where knowledge gaps exist.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer style={{ padding: '60px 24px', borderTop: '1px solid #eaeaea', background: '#fbfbfa', textAlign: 'center', position: 'relative', zIndex: 2 }}>
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
