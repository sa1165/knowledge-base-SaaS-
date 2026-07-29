import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  // If Supabase is not configured yet (local dev mode without credentials), allow access
  if (!isSupabaseConfigured) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fbfbfa', fontFamily: 'sans-serif', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 36, height: 36, border: '3px solid #eaeaea', borderTopColor: '#16161a',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 13, color: '#8e8e93', fontFamily: 'monospace' }}>Authenticating session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
