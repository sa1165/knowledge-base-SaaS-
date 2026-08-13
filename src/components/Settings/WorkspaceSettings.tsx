import React, { useState, useEffect } from 'react';
import { useApp, UserRole } from '../../context/AppContext';
import { ChevronDown, X, UserPlus, Trash2, Key, Webhook, CheckCircle2, Settings, AlertTriangle, Loader2, Shield, Copy, Link } from 'lucide-react';

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

// ── Inline Confirm Dialog ──────────────────────────────────────────────────
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, confirmLabel, onConfirm, onCancel, isLoading }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
  }}>
    <div style={{
      background: '#ffffff', borderRadius: 16, padding: '32px', maxWidth: 440, width: '90%',
      boxShadow: '0 24px 80px rgba(0,0,0,0.2)', border: '1px solid #eaeaea'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <AlertTriangle size={22} color="#dc2626" />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#16161a', margin: 0 }}>{title}</h3>
      </div>
      <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px 0' }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          disabled={isLoading}
          style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid #eaeaea',
            background: '#f9f9f8', color: '#16161a', fontSize: 13, fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: isLoading ? '#fca5a5' : '#dc2626', color: '#ffffff',
            fontSize: 13, fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(220,38,38,0.25)'
          }}
        >
          {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {isLoading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── Toast Notification ─────────────────────────────────────────────────────
interface ToastProps { message: string; type: 'success' | 'error' }
const Toast: React.FC<ToastProps> = ({ message, type }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
    background: type === 'success' ? '#059669' : '#dc2626',
    color: '#ffffff', padding: '12px 20px', borderRadius: 10,
    fontSize: 13.5, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    display: 'flex', alignItems: 'center', gap: 8, animation: 'slideUp 0.3s ease'
  }}>
    {type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
    {message}
  </div>
);

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
    setActiveScreen,
    documents,
  } = useApp();

  const [tab, setTab] = useState<SettingsTab>('general');
  const [wsName, setWsName] = useState('');
  const [wsDescription, setWsDescription] = useState('');
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');
  const [isInviting, setIsInviting] = useState(false);

  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);

  // Confirmation dialogs
  const [confirmDeleteDocs, setConfirmDeleteDocs] = useState(false);
  const [confirmDeleteWorkspace, setConfirmDeleteWorkspace] = useState(false);
  const [isDeletingDocs, setIsDeletingDocs] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync local fields with workspace
  useEffect(() => {
    if (activeWorkspace) {
      setWsName(activeWorkspace.name);
      setWsDescription(activeWorkspace.description || '');
    }
  }, [activeWorkspace?.id, activeWorkspace?.name, activeWorkspace?.description]);

  // ── No workspace selected ────────────────────────────────────────────────
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

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim() || !isOwner) return;
    setIsSavingGeneral(true);
    try {
      await updateWorkspaceDetails(activeWorkspace.id, wsName.trim(), wsDescription.trim());
      showToast('Workspace settings saved!', 'success');
    } catch {
      showToast('Failed to save settings. Try again.', 'error');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleDeleteAllDocs = async () => {
    setIsDeletingDocs(true);
    try {
      await deleteAllWorkspaceDocuments(activeWorkspace.id);
      setConfirmDeleteDocs(false);
      showToast('All documents deleted successfully.', 'success');
    } catch {
      showToast('Failed to delete documents. Try again.', 'error');
    } finally {
      setIsDeletingDocs(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    setIsDeletingWorkspace(true);
    try {
      await deleteWorkspace(activeWorkspace.id);
      setConfirmDeleteWorkspace(false);
      setActiveScreen('workspaces');
      showToast('Workspace deleted.', 'success');
    } catch {
      showToast('Failed to delete workspace. Try again.', 'error');
    } finally {
      setIsDeletingWorkspace(false);
    }
  };

  const [confirmRemoveMember, setConfirmRemoveMember] = useState<{ id: string; name: string } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail) return;

    // Check duplicate invite
    const existing = members.find(m => m.email.toLowerCase() === cleanEmail);
    if (existing) {
      showToast(`${existing.name || cleanEmail} is already a member of this workspace.`, 'error');
      return;
    }

    setIsInviting(true);
    try {
      const name = inviteName.trim() || cleanEmail.split('@')[0];
      await addMember(name, cleanEmail, inviteRole);
      setInviteEmail('');
      setInviteName('');
      showToast(`Invited ${name} as ${inviteRole}`, 'success');
    } catch {
      showToast('Failed to send invite.', 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!confirmRemoveMember) return;
    setIsRemovingMember(true);
    try {
      await removeMember(confirmRemoveMember.id);
      showToast(`Removed ${confirmRemoveMember.name} from workspace.`, 'success');
      setConfirmRemoveMember(null);
    } catch {
      showToast('Failed to remove member.', 'error');
    } finally {
      setIsRemovingMember(false);
    }
  };

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Inline Confirmation Dialogs */}
      {confirmDeleteDocs && (
        <ConfirmDialog
          title="Delete all documents?"
          message={`This will permanently remove all ${documents.filter(d => d.workspaceId === activeWorkspace.id).length} document(s) and their embeddings from "${activeWorkspace.name}". Chat history is preserved. This cannot be undone.`}
          confirmLabel="Delete all documents"
          onConfirm={handleDeleteAllDocs}
          onCancel={() => setConfirmDeleteDocs(false)}
          isLoading={isDeletingDocs}
        />
      )}

      {confirmDeleteWorkspace && (
        <ConfirmDialog
          title="Delete workspace permanently?"
          message={`"${activeWorkspace.name}" and ALL its data — documents, embeddings, chat history, and members — will be permanently deleted. This action CANNOT be undone.`}
          confirmLabel="Yes, delete workspace"
          onConfirm={handleDeleteWorkspace}
          onCancel={() => setConfirmDeleteWorkspace(false)}
          isLoading={isDeletingWorkspace}
        />
      )}

      {confirmRemoveMember && (
        <ConfirmDialog
          title="Remove team member?"
          message={`Are you sure you want to remove "${confirmRemoveMember.name}" from "${activeWorkspace.name}"? They will lose access to all documents and chat sessions in this workspace.`}
          confirmLabel="Remove member"
          onConfirm={handleConfirmRemoveMember}
          onCancel={() => setConfirmRemoveMember(null)}
          isLoading={isRemovingMember}
        />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 28px 80px' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12.5, color: '#8e8e93', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'monospace' }}>
          <span
            onClick={() => setActiveScreen('workspaces')}
            style={{ cursor: 'pointer', color: '#6b7280' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#16161a')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
          >Workspaces</span>
          <span>›</span>
          <span>{activeWorkspace.name}</span>
          <span>›</span>
          <span style={{ color: '#16161a', fontWeight: 600 }}>Settings</span>
        </div>

        <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: '#16161a', margin: '0 0 28px 0', letterSpacing: '-0.01em' }}>
          Workspace Settings
        </h1>

        {/* Tab Navigation */}
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
                  placeholder="My workspace"
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 14,
                    border: '1px solid #e5e5e3', color: '#16161a', outline: 'none',
                    background: isOwner ? '#ffffff' : '#f9f9f8', boxSizing: 'border-box',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e5e3'}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#16161a', marginBottom: 8 }}>
                  Description <span style={{ fontWeight: 400, color: '#8e8e93' }}>(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={wsDescription}
                  onChange={e => setWsDescription(e.target.value)}
                  disabled={!isOwner}
                  placeholder="Describe the scope and purpose of this workspace..."
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 8, fontSize: 13.5,
                    border: '1px solid #e5e5e3', color: '#16161a', outline: 'none',
                    background: isOwner ? '#ffffff' : '#f9f9f8', boxSizing: 'border-box',
                    fontFamily: 'sans-serif', resize: 'vertical', transition: 'border-color 0.15s'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e5e3'}
                />
              </div>

              {/* Plan badge */}
              <div style={{
                background: '#f9f9f8', border: '1px solid #eaeaea', borderRadius: 10,
                padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10
              }}>
                <Shield size={16} color="#2563eb" />
                <div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16161a', textTransform: 'capitalize' }}>
                    {activeWorkspace.tier} Plan
                  </span>
                  <span style={{ fontSize: 12, color: '#8e8e93', marginLeft: 8 }}>
                    {activeWorkspace.tier === 'free' ? '· 3 workspaces, 10 docs/workspace' : '· Unlimited'}
                  </span>
                </div>
              </div>

              {isOwner && (
                <button
                  type="submit"
                  disabled={!wsName.trim() || isSavingGeneral}
                  style={{
                    background: wsName.trim() ? '#16161a' : '#e5e5e3',
                    color: wsName.trim() ? '#ffffff' : '#8e8e93',
                    border: 'none', borderRadius: 8,
                    padding: '11px 22px', fontSize: 13, fontWeight: 600,
                    cursor: wsName.trim() && !isSavingGeneral ? 'pointer' : 'not-allowed',
                    boxShadow: wsName.trim() ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s'
                  }}
                >
                  {isSavingGeneral
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                    : 'Save changes'}
                </button>
              )}
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
                  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f4f4f3', border: '1px solid #eaeaea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <UserPlus size={22} color="#c1c1c4" />
                    </div>
                    <p style={{ fontSize: 14, color: '#8e8e93', margin: 0 }}>No members yet. Invite your team below.</p>
                  </div>
                ) : (
                  members.map(member => (
                    <div key={member.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      padding: '16px 24px', borderBottom: '1px solid #f4f4f3',
                      transition: 'background 0.1s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafaf9'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
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
                              padding: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 140
                            }}>
                              {(['editor', 'viewer'] as UserRole[]).map(r => (
                                <button
                                  key={r}
                                  onClick={() => { updateMemberRole(member.id, r); setRoleDropdown(null); }}
                                  style={{
                                    width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none',
                                    background: member.role === r ? '#f4f4f3' : 'transparent',
                                    borderRadius: 7, cursor: 'pointer', fontSize: 12.5, color: '#16161a',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                  }}
                                >
                                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{r}</span>
                                  <span style={{ fontSize: 11, color: '#8e8e93' }}>{ROLE_LABELS[r].desc}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Remove Member */}
                        {isOwner && !member.isYou && (
                          <button
                            onClick={() => setConfirmRemoveMember({ id: member.id, name: member.name })}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#c1c1c4', padding: 4, borderRadius: 4, transition: 'color 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                            onMouseLeave={e => e.currentTarget.style.color = '#c1c1c4'}
                            title="Remove member"
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
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#16161a', margin: '0 0 4px 0' }}>
                  Invite new member
                </h4>
                <p style={{ fontSize: 12.5, color: '#8e8e93', margin: '0 0 16px 0' }}>
                  Team members will have access to documents and chat in this workspace.
                </p>
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
                    onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e5e3'}
                  />
                  <input
                    type="email"
                    placeholder="Email address *"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    style={{
                      flex: 1.5, minWidth: 200, padding: '10px 14px', borderRadius: 8, fontSize: 13.5,
                      border: '1px solid #e5e5e3', color: '#16161a', outline: 'none'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e5e5e3'}
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
                    disabled={!inviteEmail.trim() || isInviting}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: inviteEmail.trim() && !isInviting ? '#16161a' : '#f4f4f3',
                      color: inviteEmail.trim() && !isInviting ? '#ffffff' : '#8e8e93',
                      border: 'none', borderRadius: 8, padding: '10px 18px',
                      fontSize: 13, fontWeight: 600, cursor: inviteEmail.trim() ? 'pointer' : 'default',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isInviting
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Inviting...</>
                      : <><UserPlus size={15} /> Send invite</>}
                  </button>
                </div>

                {/* Direct Shareable Invite Link Card */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #e5e5e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link size={15} color="#2563eb" />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#16161a' }}>Direct Workspace Invite Link</div>
                      <div style={{ fontSize: 11, color: '#8e8e93', fontFamily: 'monospace' }}>
                        {`${window.location.origin}/auth?invite=${activeWorkspace.id}`}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/auth?invite=${activeWorkspace.id}`);
                      showToast('Copied workspace invite link to clipboard!', 'success');
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6,
                      padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#2563eb',
                      cursor: 'pointer'
                    }}
                  >
                    <Copy size={13} /> Copy Link
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
              <div style={{ background: '#f9f9f8', border: '1px dashed #d1d5db', borderRadius: 8, padding: '20px 16px', textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>
                🔑 API token generation coming soon
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
              <div style={{ background: '#f9f9f8', border: '1px dashed #d1d5db', borderRadius: 8, padding: '20px 16px', textAlign: 'center', color: '#8e8e93', fontSize: 13 }}>
                🔗 Webhook configuration coming soon
              </div>
            </div>
          </div>
        )}

        {/* ── DANGER ZONE TAB ────────────────────────────────────────────── */}
        {tab === 'danger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>

            {/* Card 1: Delete all documents */}
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Trash2 size={18} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', margin: '0 0 6px 0' }}>
                    Delete all documents
                  </h3>
                  <p style={{ fontSize: 13, color: '#991b1b', opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
                    Permanently removes all {documents.filter(d => d.workspaceId === activeWorkspace.id).length} document(s) and their embeddings. Chat history is preserved.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmDeleteDocs(true)}
                disabled={!isOwner || documents.filter(d => d.workspaceId === activeWorkspace.id).length === 0}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: isOwner && documents.filter(d => d.workspaceId === activeWorkspace.id).length > 0 ? '#dc2626' : '#fca5a5',
                  color: '#ffffff',
                  border: 'none', borderRadius: 8, padding: '11px 20px',
                  fontSize: 13, fontWeight: 600,
                  cursor: isOwner && documents.filter(d => d.workspaceId === activeWorkspace.id).length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
                  transition: 'all 0.15s'
                }}
              >
                <Trash2 size={15} />
                Delete all documents
              </button>
              {documents.filter(d => d.workspaceId === activeWorkspace.id).length === 0 && (
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, marginBottom: 0 }}>
                  No documents to delete.
                </p>
              )}
            </div>

            {/* Card 2: Delete workspace */}
            <div style={{ background: '#fef2f2', border: '1.5px solid #ef4444', borderRadius: 16, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <AlertTriangle size={18} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', margin: '0 0 6px 0' }}>
                    Delete workspace
                  </h3>
                  <p style={{ fontSize: 13, color: '#991b1b', opacity: 0.85, margin: 0, lineHeight: 1.5 }}>
                    Permanently deletes <strong>"{activeWorkspace.name}"</strong>, all documents, all chat history, and removes all members. This action <strong>cannot be undone</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmDeleteWorkspace(true)}
                disabled={!isOwner}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: isOwner ? '#dc2626' : '#fca5a5', color: '#ffffff',
                  border: 'none', borderRadius: 8, padding: '11px 20px',
                  fontSize: 13, fontWeight: 600, cursor: isOwner ? 'pointer' : 'not-allowed',
                  boxShadow: '0 2px 8px rgba(220,38,38,0.2)', transition: 'all 0.15s'
                }}
              >
                <AlertTriangle size={15} />
                Delete workspace
              </button>
            </div>

          </div>
        )}

      </div>
    </>
  );
};
