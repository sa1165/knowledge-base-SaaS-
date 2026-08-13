import React, { useState } from 'react';
import { useApp, Workspace } from '../../context/AppContext';
import { 
  Folder, 
  FileText, 
  MessageSquare, 
  Users, 
  Plus, 
  Search, 
  ChevronRight, 
  X,
  LayoutGrid,
  Sparkles,
  Upload,
  Brain,
  Trash2
} from 'lucide-react';

// ── Stat Card ────────────────────────────────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; value: number | string; label: string }> = ({ icon, value, label }) => (
  <div style={{
    background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 16,
    padding: '24px', display: 'flex', flexDirection: 'column', gap: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
  }}>
    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f4f4f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5e5e62' }}>
      {icon}
    </div>
    <div>
      <div className="font-serif" style={{ fontSize: 38, fontWeight: 400, color: '#16161a', lineHeight: 1, marginBottom: 8, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: '#8e8e93', fontFamily: 'monospace' }}>{label}</div>
    </div>
  </div>
);

// ── Workspace Card ───────────────────────────────────────────────────────
const WorkspaceCard: React.FC<{
  workspace: Workspace;
  onClick: () => void;
}> = ({ workspace, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 16,
      padding: '24px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', gap: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
      transition: 'all 0.15s ease', position: 'relative'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#d1d1d1';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.05)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#eaeaea';
      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: workspace.color || '#2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff'
        }}>
          <Folder size={20} fill="#ffffff" stroke="none" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#16161a', margin: 0, lineHeight: 1.3 }}>
              {workspace.name}
            </h3>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              background: workspace.role === 'owner' ? '#f4f4f3' : workspace.role === 'editor' ? '#eff6ff' : '#f3f4f6',
              color: workspace.role === 'owner' ? '#16161a' : workspace.role === 'editor' ? '#2563eb' : '#4b5563',
              fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.04em'
            }}>
              {workspace.role === 'owner' ? '👑 Owner' : `🤝 ${workspace.role}`}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#8e8e93', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
            Updated {workspace.updatedAt}
          </p>
        </div>
      </div>
      <ChevronRight size={18} color="#c1c1c4" style={{ marginTop: 2 }} />
    </div>

    {/* Metric Footer */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#5e5e62', fontFamily: 'monospace', paddingTop: 12, borderTop: '1px solid #f9f9f8' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <FileText size={14} color="#8e8e93" />
        {workspace.docCount} docs
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Users size={14} color="#8e8e93" />
        {workspace.memberCount} members
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MessageSquare size={14} color="#8e8e93" />
        {workspace.queryCount} queries
      </span>
    </div>
  </div>
);

// ── New Workspace Card (Dashed) ──────────────────────────────────────────
const NewWorkspaceCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    style={{
      borderRadius: 16, border: '2px dashed #e5e5e3', padding: '32px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', textAlign: 'center', minHeight: 140, background: 'transparent',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = '#16161a';
      e.currentTarget.style.background = '#ffffff';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = '#e5e5e3';
      e.currentTarget.style.background = 'transparent';
    }}
  >
    <div style={{
      width: 40, height: 40, borderRadius: 12, background: '#e5e5e3',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#5e5e62'
    }}>
      <Plus size={20} />
    </div>
    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#16161a', margin: '0 0 4px 0' }}>
      New workspace
    </h4>
    <p style={{ fontSize: 12, color: '#8e8e93', margin: 0, fontFamily: 'monospace' }}>
      Upload documents and start querying
    </p>
  </div>
);

// ── New Workspace Modal ───────────────────────────────────────────────────
const NewWorkspaceModal: React.FC<{ onClose: () => void; onCreate: (name: string, desc: string) => void }> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: 16, padding: '32px', width: 460, maxWidth: '90vw',
        boxShadow: '0 24px 64px rgba(0,0,0,0.12)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h3 className="font-serif" style={{ fontSize: 22, fontWeight: 400, color: '#16161a', marginBottom: 4 }}>
              New workspace
            </h3>
            <p style={{ fontSize: 13, color: '#8e8e93' }}>
              Workspaces isolate documents, RAG indices, and team access.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#16161a', marginBottom: 6 }}>
            Workspace name
          </label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Legal Due Diligence Q4"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 8,
              border: '1px solid #e5e5e3', fontSize: 14, color: '#16161a',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#16161a', marginBottom: 6 }}>
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Brief description of documents and target team..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 8,
              border: '1px solid #e5e5e3', fontSize: 13.5, color: '#16161a',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif', resize: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '10px 18px', borderRadius: 8, border: '1px solid #eaeaea',
            background: '#ffffff', color: '#5e5e62', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => { if (name.trim()) { onCreate(name.trim(), description.trim()); onClose(); } }}
            style={{
              padding: '10px 18px', borderRadius: 8, border: 'none',
              background: name.trim() ? '#16161a' : '#eaeaea',
              color: name.trim() ? '#ffffff' : '#8e8e93',
              fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'default'
            }}
          >
            Create workspace
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ───────────────────────────────────────────────────────
export const WorkspacesDashboard: React.FC = () => {
  const { 
    workspaces, 
    setActiveWorkspace, 
    addWorkspace, 
    setActiveScreen, 
    documents, 
    members, 
    recentQueries,
    clearRecentQueries,
    userRole,
    currentUser
  } = useApp();

  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(query.toLowerCase()) ||
    (w.description && w.description.toLowerCase().includes(query.toLowerCase()))
  );

  const handleOpenWorkspace = (ws: Workspace) => {
    setActiveWorkspace(ws);
    setActiveScreen('chat');
  };

  // ── EMPTY STATE: No workspaces at all ──────────────────────────────
  if (workspaces.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 28px 80px', textAlign: 'center' }}>
        {/* Welcome hero */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: '#16161a',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h10M7 12h10M7 17h10" />
          </svg>
        </div>

        <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 400, color: '#16161a', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          Welcome, {currentUser.name}!
        </h1>
        <p style={{ fontSize: 16, color: '#8e8e93', lineHeight: 1.6, margin: '0 0 48px 0', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
          You don't have any workspaces yet. Create one to start uploading documents and querying them with AI.
        </p>

        {/* Create workspace CTA */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 12,
            padding: '16px 32px', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
          }}
        >
          <Plus size={20} />
          Create your first workspace
        </button>

        {/* Onboarding steps preview */}
        <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center', gap: 32 }}>
          {[
            { icon: <Folder size={20} />, label: 'Create workspace', desc: 'Organize your knowledge' },
            { icon: <Upload size={20} />, label: 'Upload documents', desc: 'PDF, DOCX, TXT files' },
            { icon: <Brain size={20} />, label: 'Ask questions', desc: 'AI-powered answers' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 0.5 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: '#f4f4f3', border: '1px solid #eaeaea',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e93'
              }}>
                {step.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#16161a' }}>{step.label}</div>
                <div style={{ fontSize: 11, color: '#8e8e93', fontFamily: 'monospace', marginTop: 2 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <NewWorkspaceModal
            onClose={() => setShowModal(false)}
            onCreate={(name, desc) => addWorkspace(name, desc)}
          />
        )}
      </div>
    );
  }

  // ── NORMAL STATE: Workspaces exist ──────────────────────────────────
  const totalDocCount = documents.length;
  const totalQueryCount = recentQueries.length;
  const totalMemberCount = members.length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px 80px', position: 'relative' }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 36 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 32, fontWeight: 400, color: '#16161a', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
            Workspaces
          </h1>
          <p style={{ fontSize: 13, color: '#8e8e93', margin: 0, fontFamily: 'monospace' }}>
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} · Full access
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 8,
            padding: '11px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Plus size={16} />
          New workspace
        </button>
      </div>

      {/* 4 Real-time Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 44 }}>
        <StatCard 
          icon={<Folder size={18} />} 
          value={workspaces.length} 
          label="Total workspaces" 
        />
        <StatCard 
          icon={<FileText size={18} />} 
          value={totalDocCount} 
          label="Documents indexed" 
        />
        <StatCard 
          icon={<MessageSquare size={18} />} 
          value={totalQueryCount} 
          label="Queries this month" 
        />
        <StatCard 
          icon={<Users size={18} />} 
          value={totalMemberCount} 
          label="Team members" 
        />
      </div>

      {/* Search Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 400, color: '#16161a', margin: 0 }}>
          Workspaces Overview
        </h2>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="#8e8e93" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search workspaces..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              padding: '8px 14px 8px 34px', borderRadius: 8,
              border: '1px solid #eaeaea', fontSize: 13, color: '#16161a',
              outline: 'none', background: '#ffffff', width: 230,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          />
        </div>
      </div>

      {/* 👑 Personal Workspaces Section */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          👑 Personal Workspaces (Created by You)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {filteredWorkspaces.filter(w => w.role === 'owner').map(ws => (
            <WorkspaceCard 
              key={ws.id} 
              workspace={ws} 
              onClick={() => handleOpenWorkspace(ws)} 
            />
          ))}
          <NewWorkspaceCard onClick={() => setShowModal(true)} />
        </div>
      </div>

      {/* 🤝 Shared Team Workspaces Section */}
      {filteredWorkspaces.some(w => w.role !== 'owner') && (
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            🤝 Shared Team Workspaces (Joined via Invitation)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
            {filteredWorkspaces.filter(w => w.role !== 'owner').map(ws => (
              <WorkspaceCard 
                key={ws.id} 
                workspace={ws} 
                onClick={() => handleOpenWorkspace(ws)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Queries Section */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="font-serif" style={{ fontSize: 18, fontWeight: 400, color: '#16161a', margin: 0 }}>
            Recent queries
          </h2>
          {recentQueries.length > 0 && (
            <button
              onClick={clearRecentQueries}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', borderRadius: 8,
                padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#ffe4e6'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff1f2'}
            >
              <Trash2 size={13} />
              Clear History
            </button>
          )}
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
          {recentQueries.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <MessageSquare size={24} color="#d1d1d1" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: '#16161a', fontWeight: 600, margin: '0 0 4px 0' }}>
                No queries yet
              </p>
              <p style={{ fontSize: 13, color: '#8e8e93', margin: 0 }}>
                Open a workspace and ask your first question in Chat.
              </p>
            </div>
          ) : (
            recentQueries.slice(0, 8).map((rq, idx) => (
              <div 
                key={rq.id || idx}
                onClick={() => {
                  const targetWs = workspaces.find(w => w.id === rq.workspaceId || w.name === rq.workspaceName);
                  if (targetWs) setActiveWorkspace(targetWs);
                  setActiveScreen('chat');
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                  padding: '16px 24px', borderBottom: idx === recentQueries.length - 1 ? 'none' : '1px solid #f4f4f3',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fcfcfb'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f4f4f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#8e8e93' }}>
                    <MessageSquare size={15} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#16161a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rq.query}
                    </div>
                    <div style={{ fontSize: 12, color: '#8e8e93', fontFamily: 'monospace', marginTop: 2 }}>
                      {rq.workspaceName}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, fontFamily: 'monospace' }}>
                  <div style={{ fontSize: 12, color: '#5e5e62' }}>{rq.authorName}</div>
                  <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{rq.timestamp}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>



      {showModal && (
        <NewWorkspaceModal
          onClose={() => setShowModal(false)}
          onCreate={(name, desc) => addWorkspace(name, desc)}
        />
      )}
    </div>
  );
};
