import React from 'react';
import { AppProvider, useApp } from './context/AppContext';

export { AppProvider, useApp };

// Re-export App.tsx as a thin wrapper — the main application is now AppDashboard.tsx
export default function App() {
  return null;
}
