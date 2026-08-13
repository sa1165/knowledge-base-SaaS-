import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppProvider, useApp, AppScreen } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
  Bell,
  Crown,
  Users,
  Check,
  X,
  Mail,
  CheckCircle2,
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
    currentUser, userRole, setUserRole,
    activeScreen, setActiveScreen, createNewChatSession,
    pendingInvites, acceptInvite, declineInvite
  } = useApp();
  const { signOut, user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || currentUser.name;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [wsDropdown, setWsDropdown] = useState(false);
  const [showInvitesModal, setShowInvitesModal] = useState(false);
  const wsDropdownRef = useRef<HTMLDivElement>(null);

  // Separate personal vs shared workspaces
  const personalWorkspaces = workspaces.filter(w => w.role === 'owner');
  const sharedWorkspaces = workspaces.filter(w => w.role !== 'owner');

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

      {/* ── WORKSPACE INVITES MODAL (FRIEND REQUEST STYLE) ───────────────────── */}
      {showInvitesModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 16, padding: '28px', maxWidth: 520, width: '92%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid #eaeaea'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, color: '#16161a', margin: 0 }}>
                    Workspace Invitations ({pendingInvites.length})
                  </h3>
                  <p style={{ fontSize: 12, color: '#8e8e93', margin: 0, fontFamily: 'monospace' }}>
                    Accept or decline pending workspace join requests.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowInvitesModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' }}>
              {pendingInvites.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', background: '#fcfcfb', border: '1px dashed #e5e5e3', borderRadius: 12 }}>
                  <Mail size={24} color="#c1c1c4" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: '#8e8e93', margin: 0 }}>No pending workspace invitations</p>
                </div>
              ) : (
                pendingInvites.map(inv => (
                  <div key={inv.id} style={{
                    background: '#fcfcfb', border: '1px solid #eaeaea', borderRadius: 12, padding: '16px',
                    display: 'flex', flexDirection: 'column', gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#16161a' }}>{inv.workspaceName}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          Invited by <strong style={{ color: '#16161a' }}>{inv.inviterName}</strong> ({inv.inviterEmail})
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: inv.role === 'editor' ? '#eff6ff' : '#f3f4f6',
                        color: inv.role === 'editor' ? '#2563eb' : '#4b5563',
                        textTransform: 'uppercase', fontFamily: 'monospace'
                      }}>
                        {inv.role}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                      <button
                        onClick={() => declineInvite(inv.id)}
                        style={{
                          background: '#ffffff', border: '1px solid #e5e5e3', borderRadius: 8,
                          padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#6b7280', cursor: 'pointer'
                        }}
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => { acceptInvite(inv.id); setShowInvitesModal(false); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: '#16161a', border: 'none', borderRadius: 8,
                          padding: '7px 16px', fontSize: 12, fontWeight: 600, color: '#ffffff', cursor: 'pointer'
                        }}
                      >
                        <Check size={14} /> Accept Workspace
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

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
                Docly
              </span>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Notification Bell Button */}
            <button
              onClick={() => setShowInvitesModal(true)}
              title="Workspace Invitations"
              style={{
                position: 'relative', background: '#f4f4f3', border: '1px solid #eaeaea', borderRadius: 6,
                width: 26, height: 26, cursor: 'pointer', color: '#16161a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Bell size={13} />
              {pendingInvites.length > 0 && (
                <span style={{
                  position: 'absolute', top: -3, right: -3, width: 8, height: 8,
                  borderRadius: '50%', background: '#dc2626', border: '1.5px solid #ffffff'
                }} />
              )}
            </button>

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

          {/* Workspace Switcher Menu — Categorized into Personal vs Shared */}
          {wsDropdown && (
            <div style={{
              position: 'absolute', left: 12, right: 12, top: '100%', zIndex: 50,
              background: '#ffffff', border: '1px solid #eaeaea',
              borderRadius: 10, padding: '6px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)', marginTop: 4, minWidth: 200
            }}>
              {/* 👑 PERSONAL WORKSPACES */}
              <div style={{ fontSize: 9, fontWeight: 700, color: '#8e8e93', padding: '4px 8px', textTransform: 'uppercase', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Crown size={11} color="#d97706" /> Personal Workspaces
              </div>
              {personalWorkspaces.length === 0 ? (
                <div style={{ padding: '6px 8px', color: '#a1a1aa', fontSize: 11 }}>None</div>
              ) : (
                personalWorkspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { setActiveWorkspace(ws); setWsDropdown(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      padding: '7px 8px', background: activeWorkspace?.id === ws.id ? '#f4f4f3' : 'transparent',
                      border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left', margin: '1px 0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: ws.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Folder size={10} fill="#ffffff" stroke="none" />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#16161a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ws.name}
                      </span>
                    </div>
                    <span style={{ fontSize: 9.5, color: '#16161a', fontWeight: 700, fontFamily: 'monospace' }}>Owner</span>
                  </button>
                ))
              )}

              {/* 🤝 SHARED WORKSPACES */}
              <div style={{ height: 1, background: '#f4f4f3', margin: '6px 0' }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: '#8e8e93', padding: '4px 8px', textTransform: 'uppercase', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={11} color="#2563eb" /> Shared Workspaces
              </div>
              {sharedWorkspaces.length === 0 ? (
                <div style={{ padding: '6px 8px', color: '#a1a1aa', fontSize: 11 }}>No shared team workspaces</div>
              ) : (
                sharedWorkspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { setActiveWorkspace(ws); setWsDropdown(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      padding: '7px 8px', background: activeWorkspace?.id === ws.id ? '#eff6ff' : 'transparent',
                      border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left', margin: '1px 0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: ws.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Folder size={10} fill="#ffffff" stroke="none" />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#16161a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ws.name}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 9.5, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                      background: ws.role === 'editor' ? '#eff6ff' : '#f3f4f6',
                      color: ws.role === 'editor' ? '#2563eb' : '#4b5563', textTransform: 'capitalize', fontFamily: 'monospace'
                    }}>
                      {ws.role}
                    </span>
                  </button>
                ))
              )}

              <div style={{ height: 1, background: '#f4f4f3', margin: '6px 0' }} />
              <button
                onClick={() => {
                  const name = prompt('Enter new workspace name:');
                  if (name) addWorkspace(name);
                  setWsDropdown(false);
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 8px', background: 'transparent',
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
                onClick={() => {
                  if (item.screen === 'chat') {
                    createNewChatSession();
                  }
                  setActiveScreen(item.screen);
                  setWsDropdown(false);
                }}
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
              {initials(displayName)}
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#16161a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </div>
                <button
                  onClick={() => setUserRole(userRole === 'owner' ? 'editor' : userRole === 'editor' ? 'viewer' : 'owner')}
                  title="Click to cycle role for testing RBAC permissions (Owner -> Editor -> Viewer)"
                  style={{
                    fontSize: 10.5, fontWeight: 700, color: userRole === 'owner' ? '#16161a' : userRole === 'editor' ? '#2563eb' : '#6b7280',
                    background: userRole === 'owner' ? '#f4f4f3' : userRole === 'editor' ? '#eff6ff' : '#f3f4f6',
                    border: '1px solid #e5e5e3', borderRadius: 4, padding: '1px 6px',
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace',
                    display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2
                  }}
                >
                  {userRole}
                  <span style={{ fontSize: 9 }}>▼</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
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
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <div style={{
          flex: 1,
          overflow: activeScreen === 'chat' ? 'hidden' : 'auto',
          display: activeScreen === 'chat' ? 'flex' : 'block',
          flexDirection: activeScreen === 'chat' ? 'column' : undefined,
          minHeight: 0,
        }}>
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
