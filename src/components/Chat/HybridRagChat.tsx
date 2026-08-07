import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RetrievalResult } from '../../lib/rag/hybrid-retrieval';
import {
  Send, Bot, FileText, X, ExternalLink, Download,
  CheckCircle2, AlertCircle, Loader2, MessageSquare, Sparkles, BookOpen, Layers
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
  const { messages, sendMessage, isSending, activeWorkspace, documents, setActiveScreen } = useApp();
  const [input, setInput] = useState('');
  const [selectedSource, setSelectedSource] = useState<RetrievalResult | null>(null);
  const [allSources, setAllSources] = useState<RetrievalResult[]>([]);
  const [sourceOpen, setSourceOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  // Track last AI message with sources
  const lastAiWithSources = [...messages].reverse().find(m => m.role === 'assistant' && m.sources && m.sources.length > 0);

  useEffect(() => {
    if (lastAiWithSources?.sources && lastAiWithSources.sources.length > 0) {
      setAllSources(lastAiWithSources.sources);
      setSelectedSource(lastAiWithSources.sources[0]);
    }
  }, [lastAiWithSources?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !activeWorkspace) return;
    const q = input.trim();
    setInput('');
    sendMessage(q);
  };

  const handleOpenSource = (source: RetrievalResult, sourcesList: RetrievalResult[]) => {
    setAllSources(sourcesList);
    setSelectedSource(source);
    setSourceOpen(true);
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
            Workspace Documents ({workspaceDocs.length})
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
                Upload files in Documents tab.
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
      </div>

      {/* ── CENTER: Chat Messages & Input ────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header Bar */}
        <div style={{
          padding: '12px 24px', background: '#ffffff', borderBottom: '1px solid #eaeaea',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: '#16161a', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={14} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#16161a' }}>
                Flagship RAG Engine <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: 10, marginLeft: 6 }}>Groq 3-Key + Gemini</span>
              </div>
              <div style={{ fontSize: 11, color: '#8e8e93' }}>
                Strict grounding · Zero hallucinations · &lt;2s latency
              </div>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {messages.length === 0 && (
            <div style={{ textAlign: 'center', margin: 'auto', maxWidth: 420 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, background: '#f4f4f3', border: '1px solid #eaeaea',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <Sparkles size={24} color="#2563eb" />
              </div>
              <h3 className="font-serif" style={{ fontSize: 20, fontWeight: 400, color: '#16161a', margin: '0 0 8px 0' }}>
                Ask Docly AI
              </h3>
              <p style={{ fontSize: 13, color: '#8e8e93', lineHeight: 1.6, margin: 0 }}>
                Query your documents with precision. Responses are strictly grounded with exact inline source citations.
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 6
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: '85%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#16161a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                    <Bot size={15} color="#ffffff" />
                  </div>
                )}
                <div style={{
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  padding: '14px 18px',
                  background: msg.role === 'user' ? '#16161a' : '#ffffff',
                  border: msg.role === 'user' ? 'none' : '1px solid #eaeaea',
                  color: msg.role === 'user' ? '#ffffff' : '#16161a',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>

                  {/* Inline Source Chips */}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f4f4f3', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#8e8e93', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <BookOpen size={12} /> Sources:
                      </span>
                      {msg.sources.map((src, idx) => (
                        <button
                          key={src.chunkId || idx}
                          onClick={() => handleOpenSource(src, msg.sources!)}
                          style={{
                            background: '#f4f4f3', border: '1px solid #eaeaea', borderRadius: 6,
                            padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#2563eb',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                          }}
                        >
                          [{idx + 1}] {src.documentName} {src.pageNumber ? `(p. ${src.pageNumber})` : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 10, color: msg.role === 'user' ? 'rgba(255,255,255,0.4)' : '#c1c1c4', marginTop: 6, textAlign: 'right', fontFamily: 'monospace' }}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#16161a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Loader2 size={15} color="#ffffff" style={{ animation: 'spin 1.4s linear infinite' }} />
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '4px 18px 18px 18px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: '#8e8e93', fontWeight: 600 }}>
                  <Sparkles size={14} color="#2563eb" style={{ animation: 'spin 2s linear infinite' }} />
                  Running Hybrid Vector + BM25 Reranker Search & Dual-Engine LLM...
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
              ? `Press Enter to query · ${readyCount} document${readyCount !== 1 ? 's' : ''} indexed`
              : 'Upload and index documents to start chatting'
            }
          </p>
        </div>
      </div>

      {/* ── RIGHT: Source Inspection Drawer ────────────────────────── */}
      {sourceOpen && selectedSource && (
        <div style={{
          width: 320, flexShrink: 0, background: '#ffffff', borderLeft: '1px solid #eaeaea',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#16161a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={15} color="#2563eb" /> Grounded Source Citations
              </div>
              <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{allSources.length} context match(es)</div>
            </div>
            <button onClick={() => setSourceOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Source Tab Selector */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {allSources.map((src, idx) => (
                <button
                  key={src.chunkId || idx}
                  onClick={() => setSelectedSource(src)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                    border: selectedSource.chunkId === src.chunkId ? '1px solid #2563eb' : '1px solid #eaeaea',
                    background: selectedSource.chunkId === src.chunkId ? '#eff6ff' : '#f9f9f8',
                    color: selectedSource.chunkId === src.chunkId ? '#2563eb' : '#5e5e62',
                    cursor: 'pointer', flexShrink: 0
                  }}
                >
                  Source #{idx + 1} {src.pageNumber ? `(p. ${src.pageNumber})` : ''}
                </button>
              ))}
            </div>

            {/* Selected Document Card */}
            <div style={{ background: '#fcfcfb', border: '1px solid #eaeaea', borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={16} color="#2563eb" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#16161a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedSource.documentName}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BookOpen size={12} /> {selectedSource.pageNumber ? `Exact Page ${selectedSource.pageNumber}` : 'Full section'}
                  </div>
                </div>
              </div>

              {/* Relevance Score Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: 100 }}>
                  {Math.round((selectedSource.rerankScore || selectedSource.score) * 100)}% Relevance Match
                </span>
                <span style={{ fontSize: 11, color: '#8e8e93', fontFamily: 'monospace' }}>
                  Chunk #{selectedSource.chunkId.split('-').pop() || '1'}
                </span>
              </div>

              {/* Text Excerpt */}
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8e8e93', marginBottom: 8 }}>
                Retrieved Document Passage
              </div>
              <blockquote style={{
                background: '#ffffff', border: '1px solid #eaeaea', borderRadius: 8,
                padding: '12px', fontSize: 12.5, color: '#374151', lineHeight: 1.6,
                margin: 0, maxHeight: 280, overflowY: 'auto', whiteSpace: 'pre-wrap'
              }}>
                "{selectedSource.content.replace(/---\s*Page\s+\d+\s*---/gi, '').trim()}"
              </blockquote>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
