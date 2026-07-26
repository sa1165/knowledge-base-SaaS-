import React, { useState, useEffect } from 'react';
import { useApp, UserRole } from '../../context/AppContext';
import { ChevronDown, X, UserPlus, Trash2, Key, Webhook, CheckCircle2, Settings, FolderOpen } from 'lucide-react';

type SettingsTab = 'general' | 'members' | 'integrations' | 'danger';

function avatarColor(name: string): string {
  const palette = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#db2777'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const ROLE_LABELS: Record<UserRole, { label: string; desc: string }> = {
  owner: { label: 'Owner', desc: 'Full access' },
  editor: { label: 'Editor', desc: 'Can upload' },
  viewer: { label: 'Viewer', desc: 'Read only' },
};

export const WorkspaceSettings: React.FC = () => {
  const { 
    activeWorkspace, 
    updateWorkspaceDetails, 
    deleteAllWorkspaceDocuments, 
    deleteWorkspace,
    members, 
    addMember, 
    updateMemberRole, 
    removeMember, 
    userRole,
    setActiveScreen
  } = useApp();

  const [tab, setTab] = useState<SettingsTab>('general');
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');

  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  // Keep local fields in sync when switching active workspace
  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
      setWsDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace?.id, activeWorkspace?.name, activeWorkspace?.description]);

  // ── No workspace selected state ──────────────────────────────────
  if (!activeWorkspace) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 80px' }}>
        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: '#16161a', margin: '0 0 28px 0' }}>
          Workspace Settings
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: '#f4f4f3', border: '1px solid #eaeaea',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
          }}>
            <Settings size={28} color="#c1c1c4" />
          </div>
          <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 400, color: '#16161a', margin: '0 0 10px 0' }}>
            No workspace selected
          </h2>
          <p style={{ fontSize: 14, color: '#8e8e93', lineHeight: 1.6, textAlign: 'center', maxWidth: 380 }}>
            Create a workspace first to configure settings, manage members, and integrations.
          </p>
          <button
            onClick={() => setActiveScreen('workspaces')}
            style={{
              marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 10,
              padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  const isOwner = userRole === 'owner';

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim() || !isOwner) return;
    updateWorkspaceDetails(activeWorkspace.id, wsName.trim(), wsDescription.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDeleteAllDocs = () => {
    if (!isOwner) return;
    if (window.confirm(`Are you sure you want to delete ALL documents from "${activeWorkspace.name}"? Embeddings will be cleared.`)) {
      deleteAllWorkspaceDocuments(activeWorkspace.id);
      alert('All workspace documents and embeddings have been deleted.');
    }
  };

  const handleDeleteWorkspace = () => {
    if (!isOwner) return;
    if (window.confirm(`CRITICAL WARNING: Are you sure you want to permanently delete "${activeWorkspace.name}"? This action CANNOT be undone.`)) {
      deleteWorkspace(activeWorkspace.id);
      setActiveScreen('workspaces');
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const name = inviteName.trim() || inviteEmail.split('@')[0];
    addMember(name, inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setInviteName('');
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 80px' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: 12.5, color: '#8e8e93', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
        <span>Workspaces</span>
        <span>›</span>
        <span>{activeWorkspace.name}</span>
        <span>›</span>
        <span style={{ color: '#16161a', fontWeight: 600 }}>Settings</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: '#16161a', margin: '0 0 28px 0', letterSpacing: '-0.01em' }}>
        Workspace Settings
      </h1>

      {/* Tab Navigation Line */}
      <div style={{ borderBottom: '1px solid #eaeaea', marginBottom: 32, display: 'flex', gap: 32 }}>
        {[
          { key: 'general' as const, label: 'General' },
          { key: 'members' as const, label: 'Members' },
          { key: 'integrations' as const, label: 'Integrations' },
          { key: 'danger' as const, label: 'Danger Zone' },
        ].map(t => {
          const isActive = tab === t.key;
          const isDanger = t.key === 'danger';
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: 'none', border: 'none', padding: '0 0 12px 0', cursor: 'pointer',
                fontSize: 14, fontWeight: isActive ? 600 : 500,
                color: isDanger ? (isActive ? '#dc2626' : '#991b1b') : (isActive ? '#16161a' : '#8e8e93'),
                borderBottom: isActive ? `2px solid ${isDanger ? '#dc2626' : '#16161a'}` : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.15s'
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── GENERAL TAB ──────────────────────────────────────────────────── */}
      {tab === 'general' && (
        <form onSubmit={handleSaveGeneral} style={{ maxWidth: 640 }}>
          <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, color: '#16161a', margin: '0 0 20px 0' }}>
              Workspace details
            </h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#16161a', marginBottom: 8 }}>
                Workspace name
              </label>
              <input
                type="text"
                value={wsName}
                onChange={e => setWsName(e.target.value)}
                disabled={!isOwner}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14,
                  border: '1px solid #e5e5e3', color: '#16161a', outline: 'none',
                  background: isOwner ? '#ffffff' : '#f9f9f8', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#16161a', marginBottom: 8 }}>
                Description
              </label>
              <textarea
                rows={3}
                value={wsDescription}
                onChange={e => setWsDescription(e.target.value)}
                disabled={!isOwner}
                placeholder="Workspace scope and confidentiality notes..."
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 13.5,
                  border: '1px solid #e5e5e3', color: '#16161a', outline: 'none',
                  background: isOwner ? '#ffffff' : '#f9f9f8', boxSizing: 'border-box',
                  fontFamily: 'sans-serif', resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {isOwner && (
                <button
                  type="submit"
                  disabled={!wsName.trim()}
                  style={{
                    background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 8,
                    padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  Save changes
                </button>
              )}

              {savedSuccess && (
                <span style={{ fontSize: 12.5, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'monospace' }}>
                  <CheckCircle2 size={15} /> Saved successfully
                </span>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ── MEMBERS TAB ─────────────────────────────────────────────────── */}
      {tab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Members Table Card */}
          <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="font-serif" style={{ fontSize: 18, fontWeight: 400, color: '#16161a', margin: 0 }}>
                  Team Members ({members.length})
                </h3>
                <p style={{ fontSize: 12, color: '#8e8e93', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  Manage workspace permissions and access roles.
                </p>
              </div>
            </div>

            <div>
              {members.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#8e8e93', fontSize: 13.5 }}>
                  No members in this workspace yet. Add team members below.
                </div>
              ) : (
                members.map(member => (
                  <div key={member.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    padding: '16px 24px', borderBottom: '1px solid #f4f4f3'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', background: avatarColor(member.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#ffffff', flexShrink: 0
                      }}>
                        {initials(member.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#16161a' }}>
                          {member.name} {member.isYou && <span style={{ fontSize: 11, color: '#8e8e93', fontWeight: 400 }}>(you)</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#8e8e93', fontFamily: 'monospace' }}>{member.email}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: 12, color: '#8e8e93', fontFamily: 'monospace' }}>
                        Joined {member.joinedAt}
                      </span>

                      {/* Role Dropdown */}
                      <div style={{ position: 'relative' }}>
                        {member.role === 'owner' || !isOwner ? (
                          <span style={{
                            fontSize: 11.5, fontWeight: 700, background: '#16161a', color: '#ffffff',
                            padding: '4px 12px', borderRadius: 100, textTransform: 'capitalize', fontFamily: 'monospace'
                          }}>
                            {member.role}
                          </span>
                        ) : (
                          <button
                            onClick={() => setRoleDropdown(roleDropdown === member.id ? null : member.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              background: '#f4f4f3', border: '1px solid #eaeaea', borderRadius: 100,
                              padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              color: '#16161a', textTransform: 'capitalize', fontFamily: 'monospace'
                            }}
                          >
                            {member.role}
                            <ChevronDown size={12} />
                          </button>
                        )}

                        {roleDropdown === member.id && (
                          <div style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
                            background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 10,
                            padding: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 130
                          }}>
                            {(['editor', 'viewer'] as UserRole[]).map(r => (
                              <button
                                key={r}
                                onClick={() => { updateMemberRole(member.id, r); setRoleDropdown(null); }}
                                style={{
                                  width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none',
                                  background: member.role === r ? '#f4f4f3' : 'transparent',
                                  borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#16161a',
                                  textTransform: 'capitalize'
                                }}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Remove Member Button */}
                      {isOwner && !member.isYou && (
                        <button
                          onClick={() => removeMember(member.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#c1c1c4', padding: 4, borderRadius: 4
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                          onMouseLeave={e => e.currentTarget.style.color = '#c1c1c4'}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Invite Member Form */}
          {isOwner && (
            <form onSubmit={handleSendInvite} style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 16, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#16161a', margin: '0 0 16px 0' }}>
                Invite new member
              </h4>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Full name (optional)"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  style={{
                    flex: 1, minWidth: 160, padding: '10px 14px', borderRadius: 8, fontSize: 13.5,
                    border: '1px solid #e5e5e3', color: '#16161a', outline: 'none'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  style={{
                    flex: 1.5, minWidth: 200, padding: '10px 14px', borderRadius: 8, fontSize: 13.5,
                    border: '1px solid #e5e5e3', color: '#16161a', outline: 'none'
                  }}
                />
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: '1px solid #e5e5e3', background: '#ffffff', color: '#16161a', outline: 'none'
                  }}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={!inviteEmail.trim()}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: inviteEmail.trim() ? '#16161a' : '#f4f4f3',
                    color: inviteEmail.trim() ? '#ffffff' : '#8e8e93',
                    border: 'none', borderRadius: 8, padding: '10px 18px',
                    fontSize: 13, fontWeight: 600, cursor: inviteEmail.trim() ? 'pointer' : 'default'
                  }}
                >
                  <UserPlus size={15} />
                  Send invite
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── INTEGRATIONS TAB ────────────────────────────────────────────── */}
      {tab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
          <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Key size={20} color="#2563eb" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#16161a', margin: 0 }}>API Access Tokens</h3>
            </div>
            <p style={{ fontSize: 13, color: '#8e8e93', marginBottom: 20, lineHeight: 1.5 }}>
              Generate bearer tokens to query RAG search programmatically via standard REST API endpoints.
            </p>
            <div style={{ background: '#f9f9f8', border: '1px solid #eaeaea', borderRadius: 8, padding: '14px 16px', textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>
              No API tokens generated yet. This feature will be available after Supabase integration.
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Webhook size={20} color="#7c3aed" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#16161a', margin: 0 }}>Webhook Subscriptions</h3>
            </div>
            <p style={{ fontSize: 13, color: '#8e8e93', marginBottom: 16, lineHeight: 1.5 }}>
              Receive realtime webhooks when documents finish indexing or new RAG queries are processed.
            </p>
            <div style={{ background: '#f9f9f8', border: '1px solid #eaeaea', borderRadius: 8, padding: '14px 16px', textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>
              No webhooks configured. Set up webhook endpoints after backend deployment.
            </div>
          </div>
        </div>
      )}

      {/* ── DANGER ZONE TAB ────────────────────────────────────────────── */}
      {tab === 'danger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
          
          {/* Card 1: Delete all documents */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '28px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', margin: '0 0 8px 0' }}>
              Delete all documents
            </h3>
            <p style={{ fontSize: 13, color: '#991b1b', opacity: 0.85, margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Permanently removes all documents and their embeddings from this workspace. Chat history is preserved.
            </p>
            <button
              onClick={handleDeleteAllDocs}
              disabled={!isOwner}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: isOwner ? '#dc2626' : '#fca5a5', color: '#ffffff',
                border: 'none', borderRadius: 8, padding: '11px 20px',
                fontSize: 13, fontWeight: 600, cursor: isOwner ? 'pointer' : 'not-allowed',
                boxShadow: '0 2px 8px rgba(220,38,38,0.2)'
              }}
            >
              <Trash2 size={16} />
              Delete all documents
            </button>
          </div>

          {/* Card 2: Delete workspace */}
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '28px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', margin: '0 0 8px 0' }}>
              Delete workspace
            </h3>
            <p style={{ fontSize: 13, color: '#991b1b', opacity: 0.85, margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Permanently deletes the workspace, all documents, all chat history, and removes all members. This action cannot be undone.
            </p>
            <button
              onClick={handleDeleteWorkspace}
              disabled={!isOwner}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: isOwner ? '#dc2626' : '#fca5a5', color: '#ffffff',
                border: 'none', borderRadius: 8, padding: '11px 20px',
                fontSize: 13, fontWeight: 600, cursor: isOwner ? 'pointer' : 'not-allowed',
                boxShadow: '0 2px 8px rgba(220,38,38,0.2)'
              }}
            >
              <Trash2 size={16} />
              Delete workspace
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
