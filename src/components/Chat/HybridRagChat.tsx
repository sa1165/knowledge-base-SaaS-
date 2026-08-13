import React, { useState, useRef, useEffect } from 'react';
import { useApp, ChatMessage, ChatSessionItem } from '../../context/AppContext';
import { RetrievalResult } from '../../lib/rag/hybrid-retrieval';
import {
  Send, Bot, FileText, X, Search, Plus, Trash2, Edit2, Check,
  CheckCircle2, AlertCircle, Loader2, Sparkles, BookOpen, MessageSquare, History, User,
  HelpCircle, ArrowRight, Brain
} from 'lucide-react';

function parseFollowUpQuestions(content: string): { cleanContent: string; followUps: string[] } {
  if (!content) return { cleanContent: '', followUps: [] };

  const markerMatch = content.match(/---[\s\S]*?\*?\*?Suggested Follow-up Questions:?\*?\*?/i) || content.match(/\*?\*?Suggested Follow-up Questions:?\*?\*?/i);
  if (!markerMatch) return { cleanContent: content, followUps: [] };

  const splitIdx = markerMatch.index !== undefined ? markerMatch.index : content.length;
  const cleanContent = content.slice(0, splitIdx).replace(/---\s*$/, '').trim();
  const followUpBlock = content.slice(splitIdx);

  const lines = followUpBlock.split('\n');
  const followUps: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      const q = trimmed.replace(/^[-*\d.]+\s*(💡)?\s*/, '').replace(/^\*\*|\*\*$/g, '').trim();
      if (q.length > 5 && !q.toLowerCase().includes('suggested follow-up')) {
        followUps.push(q);
      }
    }
  }

  return { cleanContent, followUps };
}

// ── Document Status Dot Indicator ─────────────────────────────────
const StatusDot: React.FC<{ status: 'ready' | 'processing' | 'uploading' | 'failed' }> = ({ status }) => {
  if (status === 'ready') return <CheckCircle2 size={13} color="#10b981" strokeWidth={2.5} />;
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

// ── Markdown Typography Renderer (Zero Raw Asterisks) ─────────────
const MarkdownRenderer: React.FC<{ content: string; onCitationClick?: (index: number) => void }> = ({ content, onCitationClick }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '6px 0 10px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const renderInline = (text: string) => {
    // Regex splits **bold** and [Source N] tokens
    const parts = text.split(/(\*\*[^*]+\*\*|\[Source \d+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={i} style={{ fontWeight: 700, color: '#111827' }}>{part.slice(2, -2)}</strong>;
      }
      const sourceMatch = part.match(/^\[Source (\d+)\]$/);
      if (sourceMatch) {
        const srcIdx = parseInt(sourceMatch[1], 10) - 1;
        return (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault();
              if (onCitationClick) onCitationClick(srcIdx);
            }}
            style={{
              background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4,
              padding: '1px 6px', fontSize: 11, fontWeight: 700, color: '#2563eb',
              cursor: 'pointer', margin: '0 2px', display: 'inline-flex', alignItems: 'center'
            }}
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    // H1 / H2 / H3 Headings (# Heading)
    if (trimmed.startsWith('#')) {
      flushList();
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const titleText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h3 key={lineIdx} style={{ fontSize: level === 1 ? 17 : 15, fontWeight: 700, color: '#111827', margin: '12px 0 4px 0', letterSpacing: '-0.01em' }}>
          {renderInline(titleText)}
        </h3>
      );
      return;
    }

    // Standalone **Heading Title** lines
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
      flushList();
      elements.push(
        <h4 key={lineIdx} style={{ fontSize: 14.5, fontWeight: 700, color: '#111827', margin: '12px 0 4px 0' }}>
          {trimmed.slice(2, -2)}
        </h4>
      );
      return;
    }

    // Bullet Lists (* item or - item)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      inList = true;
      const itemText = trimmed.slice(2);
      listItems.push(
        <li key={lineIdx} style={{ fontSize: 13.5, lineHeight: 1.6, color: '#374151' }}>
          {renderInline(itemText)}
        </li>
      );
      return;
    }

    // Standard Paragraph
    flushList();
    elements.push(
      <p key={lineIdx} style={{ fontSize: 13.5, lineHeight: 1.65, color: '#374151', margin: '0 0 8px 0' }}>
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList();
  return <div>{elements}</div>;
};

// ── Main Hybrid RAG Chat Component ────────────────────────────────
export const HybridRagChat: React.FC = () => {
  const {
    messages, sendMessage, isSending, activeWorkspace, documents, setActiveScreen,
    chatSessions, activeSessionId, createNewChatSession, renameChatSession,
    deleteChatSession, switchChatSession,
    selectedDocumentIds, setSelectedDocumentIds,
    isExpertMode, setIsExpertMode
  } = useApp();

  const [input, setInput] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [selectedSource, setSelectedSource] = useState<RetrievalResult | null>(null);
  const [allSources, setAllSources] = useState<RetrievalResult[]>([]);
  const [sourceOpen, setSourceOpen] = useState(false);

  // ── Typewriter streaming — only fires for messages the user just sent ──────
  // Rule: historical messages (from DB) render instantly. New live messages animate.
  const isLiveTyping = useRef(false);          // set true in handleSubmit, cleared after animation starts
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll only when a new message is added or session switches
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeSessionId]);

  // When session switches or messages first load, immediately show all messages in full
  // (activeSessionId + messages update in the same React batch now, so this is always correct)
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      setStreamingMsgId(last.id);
      setStreamingText(last.content);
    } else {
      setStreamingMsgId(null);
      setStreamingText('');
    }
  }, [activeSessionId]);

  // Fire typewriter ONLY for live messages the user just sent
  const lastMsg = messages[messages.length - 1];
  useEffect(() => {
    if (!lastMsg || lastMsg.role !== 'assistant') return;
    if (lastMsg.id === streamingMsgId) return; // already shown

    if (isLiveTyping.current) {
      // User just sent this — animate it
      isLiveTyping.current = false;
      setStreamingMsgId(lastMsg.id);
      const fullText = lastMsg.content;
      let currIdx = 0;
      setStreamingText('');

      const interval = setInterval(() => {
        currIdx += 4;
        if (currIdx >= fullText.length) {
          setStreamingText(fullText);
          clearInterval(interval);
        } else {
          setStreamingText(fullText.slice(0, currIdx));
        }
      }, 15);

      return () => clearInterval(interval);
    } else {
      // Loaded from DB — show immediately, no animation
      setStreamingMsgId(lastMsg.id);
      setStreamingText(lastMsg.content);
    }
  }, [lastMsg?.id]);

  // Track sources for active message
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
    isLiveTyping.current = true; // Mark next assistant reply for typewriter animation
    const q = input.trim();
    setInput('');
    sendMessage(q);
  };

  const handleOpenSource = (source: RetrievalResult, sourcesList: RetrievalResult[]) => {
    setAllSources(sourcesList);
    setSelectedSource(source);
    setSourceOpen(true);
  };

  const startRenameSession = (session: ChatSessionItem) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveRenameSession = (sessionId: string) => {
    if (editingTitle.trim()) {
      renameChatSession(sessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
  };

  const filteredSessions = chatSessions
    .filter(s => s.title !== 'New Chat' && s.title !== 'Chat')
    .filter(s => s.title.toLowerCase().includes(sessionSearch.toLowerCase()));

  const workspaceDocs = activeWorkspace
    ? documents.filter(d => d.workspaceId === activeWorkspace.id)
    : [];

  const readyCount = workspaceDocs.filter(d => d.status === 'ready').length;
  const hasIndexedDocs = readyCount > 0;

  if (!activeWorkspace) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Sparkles size={36} color="#c1c1c4" style={{ marginBottom: 16 }} />
        <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 400, color: '#16161a', margin: '0 0 8px 0' }}>
          No workspace selected
        </h2>
        <p style={{ fontSize: 13, color: '#8e8e93', margin: '0 0 20px 0' }}>
          Select or create a workspace to begin chatting with documents.
        </p>
        <button
          onClick={() => setActiveScreen('workspaces')}
          style={{ background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Go to Workspaces
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#fcfcfb', height: '100%' }}>

      {/* ── LEFT: ChatGPT-Style Chat Sessions Sidebar ────────────────────────── */}
      <div style={{
        width: 250, flexShrink: 0, background: '#ffffff', borderRight: '1px solid #eaeaea',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%'
      }}>
        
        {/* Top Action Bar */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #f4f4f3', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={createNewChatSession}
            style={{
              width: '100%', background: '#16161a', color: '#ffffff', border: 'none', borderRadius: 8,
              padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#8e8e93" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search chats..."
              value={sessionSearch}
              onChange={e => setSessionSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 32px', fontSize: 12, borderRadius: 6,
                border: '1px solid #eaeaea', background: '#f9f9f8', color: '#16161a', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8e8e93', padding: '6px 8px 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent History
          </div>

          {filteredSessions.length === 0 ? (
            <div style={{ padding: '20px 10px', textAlign: 'center', color: '#8e8e93', fontSize: 12 }}>
              No chats found.
            </div>
          ) : (
            filteredSessions.map(s => {
              const isActive = s.id === activeSessionId;
              const isEditing = editingSessionId === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => !isEditing && switchChatSession(s.id)}
                  style={{
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    background: isActive ? '#eff6ff' : 'transparent',
                    border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <MessageSquare size={14} color={isActive ? '#2563eb' : '#8e8e93'} style={{ flexShrink: 0 }} />
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveRenameSession(s.id)}
                        onBlur={() => saveRenameSession(s.id)}
                        style={{
                          width: '100%', fontSize: 12, padding: '2px 4px', borderRadius: 4,
                          border: '1px solid #2563eb', outline: 'none'
                        }}
                      />
                    ) : (
                      <span style={{
                        fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#2563eb' : '#374151',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {s.title}
                      </span>
                    )}
                  </div>

                  {/* Actions: Rename / Delete */}
                  {!isEditing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: isActive ? 1 : 0.6 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); startRenameSession(s); }}
                        title="Rename Chat"
                        style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#8e8e93' }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChatSession(s.id); }}
                        title="Delete Chat"
                        style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#ef4444' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Document Scope Selector ──────────────────────────────── */}
        <div style={{ borderTop: '1px solid #f4f4f3', flexShrink: 0 }}>
          <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#8e8e93', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileText size={11} color="#8e8e93" /> Query Scope
            </div>
            {selectedDocumentIds.length > 0 && (
              <button
                onClick={() => setSelectedDocumentIds([])}
                style={{ background: 'none', border: 'none', fontSize: 10, color: '#2563eb', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                All Docs
              </button>
            )}
          </div>
          <div style={{ padding: '0 10px 12px', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {workspaceDocs.filter(d => d.status === 'ready').map(doc => {
              const isSelected = selectedDocumentIds.includes(doc.id);
              return (
                <button
                  key={doc.id}
                  onClick={() => {
                    setSelectedDocumentIds(
                      isSelected
                        ? selectedDocumentIds.filter(id => id !== doc.id)
                        : [...selectedDocumentIds, doc.id]
                    );
                  }}
                  title={doc.filename}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                    borderRadius: 7, border: isSelected ? '1.5px solid #2563eb' : '1.5px solid #eaeaea',
                    background: isSelected ? '#eff6ff' : '#f9f9f8',
                    cursor: 'pointer', textAlign: 'left', width: '100%'
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: isSelected ? '#2563eb' : '#e5e5e3',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isSelected && <Check size={10} color="#ffffff" strokeWidth={3} />}
                  </div>
                  <span style={{
                    fontSize: 11.5, fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#2563eb' : '#374151',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                  }}>
                    {doc.filename.length > 22 ? doc.filename.slice(0, 22) + '...' : doc.filename}
                  </span>
                </button>
              );
            })}
            {workspaceDocs.filter(d => d.status === 'ready').length === 0 && (
              <div style={{ fontSize: 11, color: '#8e8e93', padding: '4px 8px' }}>No documents ready</div>
            )}
          </div>
          {selectedDocumentIds.length > 0 && (
            <div style={{ padding: '0 14px 10px', fontSize: 10.5, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
              Scoped to {selectedDocumentIds.length} doc{selectedDocumentIds.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER: Chat Messages Stream & Typewriter ────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', minHeight: 0 }}>

        {/* Top Header Bar */}
        <div style={{
          padding: '12px 24px', background: '#ffffff', borderBottom: '1px solid #eaeaea',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: isExpertMode ? '#4f46e5' : '#16161a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
              {isExpertMode ? <Brain size={15} /> : <Sparkles size={14} />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#16161a', display: 'flex', alignItems: 'center', gap: 6 }}>
                Docly AI
                {isExpertMode && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', background: '#e0e7ff', padding: '2px 8px', borderRadius: 10, border: '1px solid #c7d2fe', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Brain size={11} /> Deep Think Active
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#8e8e93' }}>
                {isExpertMode ? 'Exhaustive analytical explanations · DeepSeek-style reasoning · Grounded RAG' : 'Strict grounding · Zero hallucinations · Fast Typewriter Stream'}
              </div>
            </div>
          </div>

          {/* Expert Mode (Deep Think) Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpertMode(!isExpertMode)}
            title="Expert Mode: Generates exhaustive, deep-dive analytical explanations (DeepSeek Deep Think style)"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 20, cursor: 'pointer',
              border: isExpertMode ? '1px solid #6366f1' : '1px solid #e5e7eb',
              background: isExpertMode ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#f9fafb',
              color: isExpertMode ? '#ffffff' : '#4b5563',
              boxShadow: isExpertMode ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <Brain size={15} color={isExpertMode ? '#ffffff' : '#6366f1'} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.01em' }}>
              Expert Mode {isExpertMode ? 'ON' : 'OFF'}
            </span>
            <div style={{
              width: 24, height: 14, borderRadius: 10,
              background: isExpertMode ? '#ffffff' : '#d1d5db',
              display: 'flex', alignItems: 'center', padding: 2,
              justifyContent: isExpertMode ? 'flex-end' : 'flex-start',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: isExpertMode ? '#4f46e5' : '#ffffff'
              }} />
            </div>
          </button>
        </div>

        {/* Message Stream */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 0 }}>

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
                Ask questions about your uploaded documents. Answers are strictly grounded with exact inline page citations.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isLatestAssistant = msg.role === 'assistant' && idx === messages.length - 1;
            const rawContentToDisplay = isLatestAssistant ? streamingText : msg.content;
            const isTyping = isLatestAssistant && streamingText.length < msg.content.length;
            const { cleanContent, followUps } = parseFollowUpQuestions(rawContentToDisplay);

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
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
                    {msg.role === 'user' ? (
                      <div style={{ fontSize: 14, lineHeight: 1.65 }}>{msg.content}</div>
                    ) : (
                      <>
                        <MarkdownRenderer
                          content={cleanContent}
                          onCitationClick={(srcIdx) => msg.sources && msg.sources[srcIdx] && handleOpenSource(msg.sources[srcIdx], msg.sources)}
                        />
                        {isTyping && (
                          <span style={{ display: 'inline-block', width: 6, height: 14, background: '#2563eb', marginLeft: 4, animation: 'blink 0.8s infinite' }} />
                        )}
                      </>
                    )}

                    {/* Inline Source Chips (Appears after typing completes) */}
                    {msg.role === 'assistant' && !isTyping && msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f4f4f3', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#8e8e93', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <BookOpen size={12} /> Sources:
                        </span>
                        {msg.sources.map((src, sIdx) => (
                          <button
                            key={src.chunkId || sIdx}
                            onClick={() => handleOpenSource(src, msg.sources!)}
                            style={{
                              background: '#f4f4f3', border: '1px solid #eaeaea', borderRadius: 6,
                              padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#2563eb',
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                          >
                            [{sIdx + 1}] {src.documentName} {src.pageNumber ? `(p. ${src.pageNumber})` : ''}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Interactive Suggested Follow-up Questions Pills */}
                    {msg.role === 'assistant' && !isTyping && followUps.length > 0 && (
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #e5e5e3' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#4b5563', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Sparkles size={13} color="#2563eb" /> Suggested Follow-ups:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {followUps.map((questionText, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => sendMessage(questionText)}
                              disabled={isSending}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                borderRadius: 8, border: '1px solid #dbeafe', background: '#eff6ff',
                                color: '#1e40af', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                                textAlign: 'left', transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#dbeafe'; }}
                            >
                              <span style={{ fontSize: 13 }}>💡</span>
                              <span style={{ flex: 1 }}>{questionText}</span>
                              <ArrowRight size={13} color="#3b82f6" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking / Searching Indicator */}
          {isSending && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: isExpertMode ? '#4f46e5' : '#16161a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isExpertMode ? <Brain size={15} color="#ffffff" /> : <Bot size={15} color="#ffffff" />}
              </div>
              <div style={{
                background: isExpertMode ? '#f5f3ff' : '#ffffff',
                border: isExpertMode ? '1px solid #c7d2fe' : '1px solid #eaeaea',
                borderRadius: '4px 18px 18px 18px', padding: '12px 18px', fontSize: 13,
                color: isExpertMode ? '#4338ca' : '#8e8e93', display: 'flex', alignItems: 'center', gap: 8,
                fontWeight: isExpertMode ? 600 : 400
              }}>
                <Loader2 size={14} color={isExpertMode ? '#6366f1' : '#2563eb'} style={{ animation: 'spin 1.2s linear infinite' }} />
                <span>{isExpertMode ? '🧠 Deep Think Engine Active: Generating exhaustive masterclass analysis…' : 'Running Hybrid Vector + BM25 Reranker Search…'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '16px 24px', background: '#ffffff', borderTop: '1px solid #eaeaea' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder={hasIndexedDocs ? (isExpertMode ? "Ask a question (Expert Mode: Exhaustive Deep Analysis enabled)..." : "Ask a question about your documents...") : "Upload documents first to enable chat..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isSending || !hasIndexedDocs}
              style={{
                flex: 1, padding: '13px 18px', borderRadius: 10,
                border: isExpertMode ? '1.5px solid #a5b4fc' : '1px solid #eaeaea',
                background: hasIndexedDocs ? (isExpertMode ? '#f5f3ff' : '#fcfcfb') : '#f4f4f3',
                fontSize: 14, color: '#16161a', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending || !hasIndexedDocs}
              style={{
                background: (!input.trim() || isSending || !hasIndexedDocs) ? '#e5e5e3' : (isExpertMode ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#16161a'),
                color: '#ffffff', border: 'none', borderRadius: 10, padding: '0 20px',
                cursor: (!input.trim() || isSending || !hasIndexedDocs) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isExpertMode && input.trim() ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none'
              }}
            >
              {isExpertMode ? <Brain size={16} /> : <Send size={16} />}
            </button>
          </form>
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
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};
