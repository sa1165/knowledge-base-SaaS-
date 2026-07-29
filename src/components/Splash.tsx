import React from 'react';

export const Splash: React.FC = () => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#000000', zIndex: 9999
    }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ width: 96, height: 96, margin: '0 auto', borderRadius: 18, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(2,6,23,0.6)', animation: 'spin 2s linear infinite' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0b1220" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M7 7h10M7 12h10M7 17h10" />
          </svg>
        </div>
        <h1 style={{ marginTop: 18, fontSize: 22, letterSpacing: '-0.02em' }}>Docly</h1>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

export default Splash;
