import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Send, Bot, FileText, X, ExternalLink, Download,
  Plus, CheckCircle2, AlertCircle, Loader2, Upload, MessageSquare
} from 'lucide-react';

// ── Document Status Indicator ────────────────────────────────────
const StatusDot: React.FC<{ status: 'ready' | 'processing' | 'uploading' | 'failed' }> = ({ status }) => {
  if (status === 'ready') return (
    <CheckCircle2 size={13} color="#10b981" strokeWidth={2.5} />
  );
  if (status === 'processing' || status === 'uploading') return (
    <Loader2 size={13} color="#f59e0b" strokeWidth={2.5} style={{ animation: 'spin 1.4s linear infinite' }} />
  );
  return <AlertCircle size={13} color="#ef4444" strokeWidth={2.5} />;
};

const statusLabel = (status: string) => {
  if (status === 'uploading') return 'Uploading...';
  if (status === 'processing') return 'Indexing...';
  if (status === 'failed') return 'Failed';
  return '';
};

// ── Main Chat Component ──────────────────────────────────────────
export const HybridRagChat: React.FC = () => {
  const { messages, sendMessage, isSending, activeWorkspace, documents, uploadDocument, setActiveScreen } = useApp();
  const [input, setInput] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Track last AI message with sources
  const lastAiWithSources = [...messages].reverse().find(m => m.role === 'assistant' && m.sources && m.sources.length > 0);
  const topSource = lastAiWithSources?.sources?.[0];

  useEffect(() => {
    if (topSource) setSourceOpen(true);
  }, [topSource?.chunkId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !activeWorkspace) return;
    const q = input.trim();
    setInput('');
    sendMessage(q);
  };

  // ── No workspace selected state ──────────────────────────────────
  if (!activeWorkspace) {
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 57px)', alignItems: 'center', justifyContent: 'center', background: '#f9f9f8' }}>
        <div style={{ textAlign: 'center', padding: '60px 40px', maxWidth: 440 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, background: '#f4f4f3', border: '1px solid #eaeaea',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <MessageSquare size={28} color="#c1c1c4" />
          </div>
          <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 400, color: '#16161a', margin: '0 0 12px 0' }}>
            No workspace selected
          </h2>
          <p style={{ fontSize: 14, color: '#8e8e93', lineHeight: 1.6, margin: '0 0 28px 0' }}>
            Create a workspace first, then upload documents to start chatting with your knowledge base.
          </p>
          <button
            onClick={() => setActiveScreen('workspaces')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
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

  const workspaceDocs = documents.filter(d => d.workspaceId === activeWorkspace.id);
  const readyCount = workspaceDocs.filter(d => d.status === 'ready').length;
  const processingCount = workspaceDocs.filter(d => d.status === 'processing').length;
  const hasIndexedDocs = readyCount > 0;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 57px)', overflow: 'hidden', background: '#f9f9f8' }}>

      {/* ── LEFT: Document Sub-Panel ─────────────────────────────── */}
      <div style={{
        width: 220, flexShrink: 0, background: '#ffffff', borderRight: '1px solid #eaeaea',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid #f4f4f3' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8e8e93' }}>
            Documents
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {workspaceDocs.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <FileText size={24} color="#d1d1d1" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 12, color: '#8e8e93', lineHeight: 1.5, margin: 0 }}>
                No documents yet.
              </p>
              <p style={{ fontSize: 11, color: '#c1c1c4', margin: '6px 0 0 0' }}>
                Upload your first file to start.
              </p>
            </div>
          ) : (
            workspaceDocs.map(doc => (
              <div key={doc.id} style={{
                padding: '10px 16px', display: 'flex', alignItems: 'flex-start', gap: 10,
                borderBottom: '1px solid #f9f9f8'
              }}>
                <FileText size={14} color="#8e8e93" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#16161a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {doc.filename}
                  </div>
                  {doc.status !== 'ready' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <StatusDot status={doc.status} />
                      <span style={{
                        fontSize: 10.5,
                        color: doc.status === 'processing' ? '#f59e0b' : '#ef4444',
                        fontWeight: 600
                      }}>
                        {statusLabel(doc.status)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Documents */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #eaeaea' }}>
          <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) uploadDocument(e.target.files[0]); e.target.value = ''; }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: 'none', border: '1px dashed #d1d1d1', borderRadius: 8,
              padding: '9px 12px', fontSize: 12, color: '#8e8e93', cursor: 'pointer', fontWeight: 600
            }}
          >
            <Plus size={13} />
            Add documents
          </button>
        </div>
      </div>

      {/* ── CENTER: Chat Area ────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Chat Header */}
        <div style={{ padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #eaeaea', flexShrink: 0 }}>
          <h2 className="font-serif" style={{ fontSize: 16, fontWeight: 500, color: '#16161a' }}>
            {activeWorkspace.name}
          </h2>
          <p style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>
            {readyCount} doc{readyCount !== 1 ? 's' : ''} ready
            {processingCount > 0 && ` · ${processingCount} processing`}
            {topSource && (
              <button
                onClick={() => setSourceOpen(!sourceOpen)}
                style={{
                  marginLeft: 10, background: '#edf4fc', border: 'none',
                  borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#2563eb',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                {sourceOpen ? 'Hide' : 'Show'} Sources
              </button>
            )}
          </p>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Empty state — no docs uploaded yet */}
          {messages.length === 0 && !hasIndexedDocs && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 20px' }}>
              <div style={{ width: 56, height: 56, background: '#f4f4f3', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eaeaea' }}>
                <Upload size={24} color="#c1c1c4" />
              </div>
              <div style={{ textAlign: 'center', maxWidth: 380 }}>
                <p className="font-serif" style={{ fontSize: 20, color: '#16161a', fontWeight: 400, margin: '0 0 8px 0' }}>
                  No documents indexed yet
                </p>
                <p style={{ fontSize: 13, color: '#8e8e93', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                  Upload documents to this workspace before you can start chatting. Every answer cites its source.
                </p>
                <button
                  onClick={() => setActiveScreen('documents')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 10,
                    padding: '11px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <Upload size={15} />
                  Go to Documents
                </button>
              </div>
            </div>
          )}

          {/* Empty state — docs exist but no chat yet */}
          {messages.length === 0 && hasIndexedDocs && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 20px' }}>
              <div style={{ width: 48, height: 48, background: '#f4f4f3', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={24} color="#8e8e93" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="font-serif" style={{ fontSize: 18, color: '#16161a', fontWeight: 400, margin: '0 0 8px 0' }}>
                  Ask your first question
                </p>
                <p style={{ fontSize: 13, color: '#8e8e93', marginTop: 6 }}>
                  {readyCount} document{readyCount !== 1 ? 's' : ''} indexed in <strong>{activeWorkspace.name}</strong>. Ask anything — every answer cites its source.
                </p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex', gap: 12,
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end'
            }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#edf4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 4 }}>
                  <Bot size={15} color="#2563eb" />
                </div>
              )}
              <div style={{
                maxWidth: '72%', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                padding: '14px 18px',
                background: msg.role === 'user' ? '#16161a' : '#ffffff',
                border: msg.role === 'user' ? 'none' : '1px solid #eaeaea',
                color: msg.role === 'user' ? '#ffffff' : '#16161a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: 10, color: msg.role === 'user' ? 'rgba(255,255,255,0.4)' : '#c1c1c4', marginTop: 8, textAlign: 'right', fontFamily: 'monospace' }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f4f4f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Loader2 size={15} color="#8e8e93" style={{ animation: 'spin 1.4s linear infinite' }} />
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '4px 18px 18px 18px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, background: '#d1d1d1', borderRadius: '50%',
                      display: 'inline-block',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '12px 20px 16px', background: '#ffffff', borderTop: '1px solid #eaeaea', flexShrink: 0 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder={hasIndexedDocs ? 'Ask a question about your documents...' : 'Upload documents first to enable chat...'}
              disabled={isSending || !hasIndexedDocs}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10,
                border: '1px solid #eaeaea', fontSize: 13.5, color: '#16161a',
                outline: 'none', background: hasIndexedDocs ? '#fbfbfa' : '#f4f4f3',
                opacity: hasIndexedDocs ? 1 : 0.6
              }}
            />
            <button type="submit" disabled={!input.trim() || isSending || !hasIndexedDocs} style={{
              width: 38, height: 38, borderRadius: 10, background: '#16161a', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: !input.trim() || isSending || !hasIndexedDocs ? 'default' : 'pointer',
              opacity: !input.trim() || isSending || !hasIndexedDocs ? 0.3 : 1, flexShrink: 0
            }}>
              <Send size={15} color="#ffffff" />
            </button>
          </form>
          <p style={{ fontSize: 11, color: '#c1c1c4', marginTop: 8, textAlign: 'center' }}>
            {hasIndexedDocs
              ? `Press Enter to send · ${readyCount} doc${readyCount !== 1 ? 's' : ''} in context`
              : 'Upload and index documents to start chatting'
            }
          </p>
        </div>
      </div>

      {/* ── RIGHT: Source Panel ──────────────────────────────────── */}
      {sourceOpen && topSource && (
        <div style={{
          width: 280, flexShrink: 0, background: '#ffffff', borderLeft: '1px solid #eaeaea',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16161a' }}>Source</div>
              <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>Last cited document</div>
            </div>
            <button onClick={() => setSourceOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Document Name */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} color="#dc2626" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#16161a' }}>{topSource.documentName}</div>
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>
                  {topSource.pageNumber ? `Page ${topSource.pageNumber}` : 'Source chunk'}
                </div>
              </div>
            </div>

            {/* Cited Excerpt */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8e8e93', marginBottom: 10 }}>
                Cited excerpt
              </div>
              <blockquote style={{
                background: '#fbfbfa', border: '1px solid #eaeaea', borderRadius: 10,
                padding: '14px', fontSize: 12.5, color: '#5e5e62', lineHeight: 1.65,
                fontStyle: 'italic', margin: 0
              }}>
                "{topSource.content.slice(0, 300)}{topSource.content.length > 300 ? '...' : ''}"
              </blockquote>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 8,
                padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#2563eb', cursor: 'pointer'
              }}>
                <ExternalLink size={14} />
                Open source document
              </button>
              <button style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 8,
                padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#5e5e62', cursor: 'pointer'
              }}>
                <Download size={14} />
                Download {topSource.documentName}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
