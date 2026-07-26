import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppProvider, useApp, AppScreen } from '../context/AppContext';
import { WorkspacesDashboard } from '../components/Workspaces/WorkspacesDashboard';
import { HybridRagChat } from '../components/Chat/HybridRagChat';
import { DocumentUploadStudio } from '../components/Documents/DocumentUploadStudio';
import { WorkspaceSettings } from '../components/Settings/WorkspaceSettings';
import { BillingStudio } from '../components/Billing/BillingStudio';
import {
  Folder,
  LayoutGrid,
  MessageSquare,
  FileText,
  Settings,
  CreditCard,
  ChevronDown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';

// ── Nav Items (matching Sidebar in uploaded images) ───────────────────────
const NAV_ITEMS: { screen: AppScreen; icon: React.ReactNode; label: string }[] = [
  { screen: 'workspaces', icon: <LayoutGrid size={16} />, label: 'Workspaces' },
  { screen: 'chat',       icon: <MessageSquare size={16} />, label: 'Chat' },
  { screen: 'documents',  icon: <FileText size={16} />, label: 'Documents' },
  { screen: 'settings',   icon: <Settings size={16} />, label: 'Settings' },
  { screen: 'billing',    icon: <CreditCard size={16} />, label: 'Billing' },
];

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Inner Dashboard ────────────────────────────────────────────────────────
const InnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    workspaces, activeWorkspace, setActiveWorkspace, addWorkspace,
    currentUser, userRole,
    activeScreen, setActiveScreen,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wsDropdown, setWsDropdown] = useState(false);
  const wsDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(e.target as Node)) {
        setWsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fbfbfa', overflow: 'hidden' }}>

      {/* ── SIDEBAR (Matching uploaded mockups) ───────────────────────── */}
      <div style={{
        width: sidebarOpen ? 210 : 64,
        flexShrink: 0,
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        background: '#ffffff',
        borderRight: '1px solid #eaeaea',
        overflow: 'hidden',
        zIndex: 30,
      }}>

        {/* Brand Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          padding: '18px 16px',
          borderBottom: '1px solid #f4f4f3',
          minHeight: 60,
        }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setActiveScreen('workspaces')}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, background: '#16161a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M7 7h10M7 12h10M7 17h10" />
                </svg>
              </div>
              <span className="font-serif" style={{ fontSize: 18, fontWeight: 700, color: '#16161a', letterSpacing: '-0.01em' }}>
                DocMind
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: '#f4f4f3', border: '1px solid #eaeaea', borderRadius: 6,
              width: 24, height: 24, cursor: 'pointer', color: '#8e8e93',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            {sidebarOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>

        {/* Workspace Dropdown Trigger */}
        <div style={{ padding: '12px 12px 6px', position: 'relative' }} ref={wsDropdownRef}>
          {sidebarOpen && (
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a1a1aa', padding: '0 4px', marginBottom: 6, fontFamily: 'monospace' }}>
              WORKSPACE
            </div>
          )}
          <button
            onClick={() => setWsDropdown(!wsDropdown)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: sidebarOpen ? '8px 10px' : '8px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              background: '#ffffff', border: '1px solid #e5e5e3',
              borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: activeWorkspace?.color || '#8e8e93',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0
            }}>
              <Folder size={13} fill="#ffffff" stroke="none" />
            </div>

            {sidebarOpen && (
              <>
                <span style={{
                  fontSize: 12.5, fontWeight: 600, color: '#16161a', flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {activeWorkspace ? activeWorkspace.name : 'No workspace'}
                </span>
                <ChevronDown size={13} color="#8e8e93" style={{ flexShrink: 0 }} />
              </>
            )}
          </button>

          {/* Workspace Switcher Menu */}
          {wsDropdown && (
            <div style={{
              position: 'absolute', left: 12, right: 12, top: '100%', zIndex: 50,
              background: '#ffffff', border: '1px solid #eaeaea',
              borderRadius: 10, padding: '4px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.1)', marginTop: 4,
            }}>
              {workspaces.length === 0 ? (
                <div style={{ padding: '16px 10px', textAlign: 'center', color: '#8e8e93', fontSize: 12 }}>
                  No workspaces yet
                </div>
              ) : (
                workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { setActiveWorkspace(ws); setWsDropdown(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', background: activeWorkspace?.id === ws.id ? '#f4f4f3' : 'transparent',
                      border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 5, background: ws.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0
                    }}>
                      <Folder size={11} fill="#ffffff" stroke="none" />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#16161a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ws.name}
                    </span>
                  </button>
                ))
              )}
              <div style={{ height: 1, background: '#f4f4f3', margin: '4px 0' }} />
              <button
                onClick={() => {
                  const name = prompt('Enter new workspace name:');
                  if (name) addWorkspace(name);
                  setWsDropdown(false);
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', background: 'transparent',
                  border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                  color: '#2563eb', fontSize: 12, fontWeight: 600
                }}
              >
                <Plus size={13} />
                New workspace
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV_ITEMS.map(item => {
            const active = activeScreen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => { setActiveScreen(item.screen); setWsDropdown(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: sidebarOpen ? '9px 12px' : '9px',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active ? '#e5e5e3' : 'transparent',
                  color: active ? '#16161a' : '#5e5e62',
                  fontWeight: active ? 600 : 500,
                  transition: 'all 0.1s ease', position: 'relative',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? '#16161a' : '#8e8e93' }}>
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span style={{ fontSize: 13, whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                    {item.label}
                  </span>
                )}
                {active && (
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', background: '#16161a', display: 'inline-block'
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Footer */}
        <div style={{ borderTop: '1px solid #f4f4f3', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: sidebarOpen ? '4px 6px' : '4px',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#881337',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#ffffff', flexShrink: 0,
            }}>
              {initials(currentUser.name)}
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#16161a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: 11, color: '#8e8e93', textTransform: 'capitalize', fontFamily: 'monospace' }}>
                  {userRole}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: sidebarOpen ? '8px 6px' : '8px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              background: 'transparent', border: 'none',
              borderRadius: 6, cursor: 'pointer', color: '#8e8e93',
              fontSize: 12, fontWeight: 500, width: '100%',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#16161a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8e8e93')}
          >
            <LogOut size={13} style={{ flexShrink: 0 }} />
            {sidebarOpen && 'Sign out'}
          </button>
        </div>

      </div>

      {/* ── MAIN SCREEN DISPLAY ─────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: 1, overflow: activeScreen === 'chat' ? 'hidden' : 'auto' }}>
          {activeScreen === 'workspaces' && <WorkspacesDashboard />}
          {activeScreen === 'chat'       && <HybridRagChat />}
          {activeScreen === 'documents'  && <DocumentUploadStudio />}
          {activeScreen === 'settings'   && <WorkspaceSettings />}
          {activeScreen === 'billing'    && <BillingStudio />}
        </div>
      </div>

    </div>
  );
};

export const AppDashboard: React.FC = () => (
  <AppProvider>
    <InnerDashboard />
  </AppProvider>
);
