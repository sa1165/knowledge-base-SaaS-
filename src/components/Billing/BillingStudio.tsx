import React from 'react';
import { useApp } from '../../context/AppContext';
import { Zap, FileText, MessageSquare, Mail, FolderOpen } from 'lucide-react';

export const BillingStudio: React.FC = () => {
  const { activeWorkspace, documents, messages, setActiveScreen } = useApp();

  if (!activeWorkspace) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 24px' }}>
        <h1 className="font-serif" style={{ fontSize: 28, fontWeight: 400, color: '#16161a', marginBottom: 6 }}>
          Usage
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: '#f4f4f3', border: '1px solid #eaeaea',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
          }}>
            <FolderOpen size={28} color="#c1c1c4" />
          </div>
          <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 400, color: '#16161a', margin: '0 0 10px 0' }}>
            No workspace selected
          </h2>
          <p style={{ fontSize: 14, color: '#8e8e93', lineHeight: 1.6, textAlign: 'center', maxWidth: 380 }}>
            Create or select a workspace to monitor usage limits and tier quotas.
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

  const indexedDocs = documents.filter(d => d.status === 'ready').length;
  const totalDocs = 50; // plan limit placeholder
  const totalQueries = messages.filter(m => m.role === 'user').length;
  const queryLimit = 2500;

  const docPct = Math.min(Math.round((indexedDocs / totalDocs) * 100), 100);
  const queryPct = Math.min(Math.round((totalQueries / queryLimit) * 100), 100);

  const Meter: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: number;
    limit: number;
    unit: string;
    pct: number;
    color: string;
    note: string;
  }> = ({ icon, label, value, limit, unit, pct, color, note }) => (
    <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 14, padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color }}>{icon}</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#16161a' }}>{label}</span>
        </div>
        <span style={{ fontSize: 13, fontFamily: 'monospace', color, fontWeight: 700 }}>
          {value} / {limit} {unit}
        </span>
      </div>
      <div style={{ height: 8, background: '#f4f4f3', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      <p style={{ fontSize: 12, color: '#8e8e93' }}>{note}</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ paddingBottom: 20, borderBottom: '1px solid #eaeaea' }}>
        <h1 className="font-serif" style={{ fontSize: 28, fontWeight: 400, color: '#16161a', marginBottom: 6 }}>
          Usage
        </h1>
        <p style={{ fontSize: 13, color: '#8e8e93' }}>
          Current usage for <span style={{ color: '#16161a', fontWeight: 600 }}>{activeWorkspace.name}</span>. Resets on the 1st of each month.
        </p>
      </div>

      {/* Meters */}
      <Meter
        icon={<FileText size={18} />}
        label="Documents Indexed"
        value={indexedDocs}
        limit={totalDocs}
        unit="docs"
        pct={docPct}
        color="#2563eb"
        note={`${totalDocs - indexedDocs} document slots remaining. Includes all PDFs, Word docs, and text files that have been chunked and embedded.`}
      />
      <Meter
        icon={<MessageSquare size={18} />}
        label="Hybrid RAG Queries"
        value={totalQueries}
        limit={queryLimit}
        unit="queries"
        pct={queryPct}
        color="#7c3aed"
        note="Each question sent through the chat counts as one query. Resets on the 1st of next month."
      />
      <Meter
        icon={<Zap size={18} />}
        label="Workspace Members"
        value={activeWorkspace.memberCount}
        limit={20}
        unit="seats"
        pct={Math.round((activeWorkspace.memberCount / 20) * 100)}
        color="#059669"
        note="Active team members with access to this workspace. Manage members in Settings → Members."
      />

      {/* Contact CTA */}
      <div style={{
        background: '#16161a', borderRadius: 14, padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap'
      }}>
        <div>
          <h3 className="font-serif" style={{ fontSize: 20, fontWeight: 400, color: '#ffffff', marginBottom: 6 }}>
            Need higher limits?
          </h3>
          <p style={{ fontSize: 13, color: '#8e8e93', lineHeight: 1.5 }}>
            Contact us for enterprise pricing — unlimited workspaces, custom SLA, SAML SSO, and dedicated infrastructure.
          </p>
        </div>
        <a href="mailto:hello@docmind.ai" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#ffffff', color: '#16161a', textDecoration: 'none',
          borderRadius: 8, padding: '11px 20px', fontSize: 13, fontWeight: 700, flexShrink: 0
        }}>
          <Mail size={14} />
          Contact sales
        </a>
      </div>

    </div>
  );
};
