import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { processDocumentIngestion } from '../lib/ingestion/pipeline';
import { performHybridSearch, RetrievalResult, globalVectorIndex } from '../lib/rag/hybrid-retrieval';
import { generateGroundedResponse, contextualizeQuery } from '../lib/rag/llm-provider';
import { dbApi } from '../lib/api';
import { storage } from '../lib/storage';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type UserRole = 'owner' | 'editor' | 'viewer';
export type AppScreen = 'workspaces' | 'chat' | 'documents' | 'settings' | 'billing';
export type AppTab = 'chat' | 'documents' | 'eval' | 'billing';

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
  isYou?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  role: UserRole;
  tier: 'free' | 'pro' | 'enterprise';
  docCount: number;
  memberCount: number;
  queryCount: number;
  updatedAt: string;
  color: string;
}

export interface DocumentItem {
  id: string;
  workspaceId: string;
  filename: string;
  fileSize: number;
  pages: number;
  mimeType: string;
  status: 'ready' | 'processing' | 'uploading' | 'failed';
  chunkCount: number;
  uploadedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: RetrievalResult[];
  timestamp: string;
}

export interface ChatSessionItem {
  id: string;
  workspaceId: string;
  title: string;
  updatedAt: string;
}

export interface RecentQuery {
  id: string;
  query: string;
  workspaceId: string;
  workspaceName: string;
  authorName: string;
  timestamp: string;
}

interface AppContextType {
  // Workspaces
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (ws: Workspace) => void;
  addWorkspace: (name: string, description?: string) => Promise<void>;
  updateWorkspaceDetails: (workspaceId: string, name: string, description: string) => Promise<void>;
  deleteAllWorkspaceDocuments: (workspaceId: string) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;

  // Members
  members: WorkspaceMember[];
  addMember: (name: string, email: string, role: UserRole) => Promise<void>;
  updateMemberRole: (memberId: string, role: UserRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  // User / Role
  currentUser: { name: string; email: string };
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Documents
  documents: DocumentItem[];
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  reprocessDocument: (docId: string) => Promise<void>; // Re-chunk with latest pipeline

  // Chat Sessions & Messages
  chatSessions: ChatSessionItem[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  recentQueries: RecentQuery[];
  clearRecentQueries: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  isExpertMode: boolean;
  setIsExpertMode: (val: boolean) => void;
  createNewChatSession: () => Promise<void>;
  renameChatSession: (sessionId: string, newTitle: string) => Promise<void>;
  deleteChatSession: (sessionId: string) => Promise<void>;
  switchChatSession: (sessionId: string) => Promise<void>;

  // Document Scope Filter (per-chat document selector)
  selectedDocumentIds: string[];         // empty = search all documents
  setSelectedDocumentIds: (ids: string[]) => void;

  // Navigation
  activeScreen: AppScreen;
  setActiveScreen: (screen: AppScreen) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── ALL STATE STARTS EMPTY ─────────────────────────────────────────────
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([]);
  const [activeScreen, setActiveScreen] = useState<AppScreen>('workspaces');
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const [isSending, setIsSending] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string }>({ name: 'User', email: '' });

  const chatSessionRef = useRef<string | null>(null);

  // ── Safe active workspace setter ───────────────────────────────────────
  const setActiveWorkspace = async (ws: Workspace) => {
    setActiveWorkspaceState(ws);
    await loadWorkspaceData(ws.id);
  };

  // Sync activeWorkspace pointer after workspace list updates
  useEffect(() => {
    if (activeWorkspace) {
      const updated = workspaces.find(w => w.id === activeWorkspace.id);
      if (updated) setActiveWorkspaceState(updated);
      else if (workspaces.length > 0) setActiveWorkspaceState(workspaces[0]);
      else setActiveWorkspaceState(null);
    }
  }, [workspaces]);

  // ── Load all data for a specific workspace from Supabase ───────────────
  const loadWorkspaceData = async (workspaceId: string) => {
    // Clear chat state immediately to prevent stale workspace leak
    setMessages([]);
    setChatSessions([]);
    setActiveSessionId(null);
    chatSessionRef.current = null;

    const [dbDocs, dbMembers, dbSessions, dbChunks, dbQueries, resolvedRole] = await Promise.all([
      dbApi.getDocuments(workspaceId),
      dbApi.getMembers(workspaceId),
      dbApi.getChatSessions(workspaceId),
      dbApi.getWorkspaceChunks(workspaceId),
      dbApi.getRecentQueries(50),
      dbApi.getUserRoleForWorkspace(workspaceId),
    ]);
    setDocuments(dbDocs);
    setMembers(dbMembers);
    setUserRole(resolvedRole);
    // Filter out any legacy empty 'New Chat' sessions from DB list
    const validSessions = dbSessions.filter(s => s.title !== 'New Chat' && s.title !== 'Chat');
    setChatSessions(validSessions);
    setRecentQueries(dbQueries);

    // Default to clean empty chat state (session created only when user sends a query)
    setActiveSessionId(null);
    chatSessionRef.current = null;
    setMessages([]);

    // Hydrate in-memory RAG index with chunks persisted in Supabase
    if (dbChunks && dbChunks.length > 0) {
      globalVectorIndex.clearWorkspace(workspaceId);
      globalVectorIndex.addChunks(
        dbChunks.map(c => ({
          id: c.id,
          documentId: c.document_id,
          documentName: dbDocs.find(d => d.id === c.document_id)?.filename || 'Document',
          workspaceId: c.workspace_id,
          content: c.content,
          embedding: Array.isArray(c.embedding) ? c.embedding : [],
          pageNumber: c.page_number,
        }))
      );
    }
  };

  // ── Bootstrap: auth state listener loads everything on sign-in ─────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const bootstrap = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      if (session?.user) {
        const meta = session.user.user_metadata;
        setCurrentUser({
          name: meta?.full_name || meta?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
      }

      const dbWorkspaces = await dbApi.getWorkspaces();
      setWorkspaces(dbWorkspaces);

      if (dbWorkspaces.length > 0) {
        setActiveWorkspaceState(dbWorkspaces[0]);
        await loadWorkspaceData(dbWorkspaces[0].id);
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata;
        setCurrentUser({
          name: meta?.full_name || meta?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
        const dbWorkspaces = await dbApi.getWorkspaces();
        setWorkspaces(dbWorkspaces);
        if (dbWorkspaces.length > 0) {
          setActiveWorkspaceState(dbWorkspaces[0]);
          await loadWorkspaceData(dbWorkspaces[0].id);
        }
      } else if (event === 'SIGNED_OUT') {
        setWorkspaces([]);
        setActiveWorkspaceState(null);
        setMembers([]);
        setDocuments([]);
        setMessages([]);
        setChatSessions([]);
        setActiveSessionId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // WORKSPACE ACTIONS
  // ══════════════════════════════════════════════════════════════════

  const addWorkspace = async (name: string, description?: string) => {
    const newWs = await dbApi.createWorkspace(name, description);
    if (!newWs) return;
    setWorkspaces(prev => [newWs, ...prev]);
    setActiveWorkspaceState(newWs);
    await loadWorkspaceData(newWs.id);
  };

  const updateWorkspaceDetails = async (workspaceId: string, name: string, description: string) => {
    if (userRole === 'viewer') { alert('Permission Denied: Viewer role cannot edit workspace settings.'); return; }
    await dbApi.updateWorkspace(workspaceId, name, description);
    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, name, description } : w));
  };

  const deleteAllWorkspaceDocuments = async (workspaceId: string) => {
    if (userRole !== 'owner') { alert('Permission Denied: Only Workspace Owners can perform batch document deletion.'); return; }
    await dbApi.deleteAllWorkspaceDocuments(workspaceId);
    setDocuments([]);
    globalVectorIndex.clearWorkspace(workspaceId);
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (userRole !== 'owner') { alert('Permission Denied: Only Workspace Owners can delete a workspace.'); return; }
    await dbApi.deleteWorkspace(workspaceId);
    setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    globalVectorIndex.clearWorkspace(workspaceId);
  };

  // ══════════════════════════════════════════════════════════════════
  // WORKSPACE MEMBERS
  // ══════════════════════════════════════════════════════════════════

  const addMember = async (name: string, email: string, role: UserRole) => {
    if (!activeWorkspace) return;
    if (userRole !== 'owner') { alert('Permission Denied: Only Workspace Owners can invite team members.'); return; }
    const dbMemberId = await dbApi.addMember(activeWorkspace.id, email, role);
    const newMem: WorkspaceMember = {
      id: typeof dbMemberId === 'string' ? dbMemberId : `mem-${Date.now()}`,
      workspaceId: activeWorkspace.id,
      name,
      email,
      role,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setMembers(prev => [...prev, newMem]);
  };

  const updateMemberRole = async (memberId: string, role: UserRole) => {
    if (userRole !== 'owner') { alert('Permission Denied: Only Workspace Owners can manage team roles.'); return; }
    await dbApi.updateMemberRole(memberId, role);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const removeMember = async (memberId: string) => {
    if (userRole !== 'owner') { alert('Permission Denied: Only Workspace Owners can remove team members.'); return; }
    await dbApi.removeMember(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  // ══════════════════════════════════════════════════════════════════
  // DOCUMENT UPLOAD + DELETE
  // ══════════════════════════════════════════════════════════════════

  const uploadDocument = async (file: File) => {
    if (!activeWorkspace) return;
    if (userRole === 'viewer') { alert('Permission Denied: Viewer role cannot upload documents.'); return; }

    const estPages = Math.max(1, Math.ceil(file.size / 30000));
    const dbDocId = await dbApi.createDocument(activeWorkspace.id, file);
    const docId = dbDocId || `doc-${Date.now()}`;

    const newDoc: DocumentItem = {
      id: docId,
      workspaceId: activeWorkspace.id,
      filename: file.name,
      fileSize: file.size,
      pages: estPages,
      mimeType: file.type || 'application/pdf',
      status: 'uploading',
      chunkCount: 0,
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setDocuments(prev => [newDoc, ...prev]);

    try {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'processing' } : d));
      await dbApi.updateDocumentStatus(docId, 'processing', 0);

      const arrayBuffer = await file.arrayBuffer();
      const result = await processDocumentIngestion(activeWorkspace.id, docId, file.name, arrayBuffer, file.type);

      setDocuments(prev => prev.map(d => d.id === docId ? { 
        ...d, 
        status: result.status, 
        chunkCount: result.chunkCount,
        pages: result.pageCount || d.pages
      } : d));
      await dbApi.updateDocumentStatus(docId, result.status, result.chunkCount, result.pageCount);
    } catch {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'failed' } : d));
      await dbApi.updateDocumentStatus(docId, 'failed', 0);
    }
  };

  /**
   * Re-processes an existing document with the current (latest) chunking pipeline.
   * Useful when the chunker has been improved and existing docs need re-indexing.
   * Fetches the raw file from Supabase Storage, deletes old chunks, re-ingests.
   */
  const reprocessDocument = async (docId: string) => {
    if (!activeWorkspace) return;
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'processing' } : d));
    await dbApi.updateDocumentStatus(docId, 'processing', 0);

    try {
      // Fetch raw file bytes from Supabase Storage
      const storageKey = `workspaces/${activeWorkspace.id}/documents/${docId}-${doc.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const fileData = await storage.downloadFile(storageKey);
      if (!fileData) throw new Error('Could not download file from storage');

      // Evict old chunks from in-memory index
      globalVectorIndex.removeDocumentChunks(docId);
      // Delete old chunks from Supabase
      await dbApi.deleteDocumentChunks(docId);

      // Re-run with current (improved) pipeline
      const result = await processDocumentIngestion(activeWorkspace.id, docId, doc.filename, fileData, doc.mimeType);

      setDocuments(prev => prev.map(d => d.id === docId ? { 
        ...d, 
        status: result.status, 
        chunkCount: result.chunkCount,
        pages: result.pageCount || d.pages
      } : d));
      await dbApi.updateDocumentStatus(docId, result.status, result.chunkCount, result.pageCount);
    } catch (err: any) {
      console.error('[reprocessDocument] Error:', err);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'failed' } : d));
      await dbApi.updateDocumentStatus(docId, 'failed', 0);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (userRole === 'viewer') { alert('Permission Denied: Viewer role cannot delete documents.'); return; }
    await dbApi.deleteDocument(docId);
    // Evict from in-memory RAG index
    globalVectorIndex.removeDocumentChunks(docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));

    // Delete chat messages referencing this document
    if (activeWorkspace) {
      await dbApi.deleteMessagesForDocument(activeWorkspace.id, docId);
      if (activeSessionId) {
        const updatedMsgs = await dbApi.getChatMessagesForSession(activeSessionId);
        setMessages(updatedMsgs);
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // CHAT SESSIONS & MESSAGES
  // ══════════════════════════════════════════════════════════════════

  const createNewChatSession = async () => {
    setActiveSessionId(null);
    chatSessionRef.current = null;
    setMessages([]);
  };

  const renameChatSession = async (sessionId: string, newTitle: string) => {
    await dbApi.renameChatSession(sessionId, newTitle);
    setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
  };

  const deleteChatSession = async (sessionId: string) => {
    await dbApi.deleteChatSession(sessionId);
    const nextSessions = chatSessions.filter(s => s.id !== sessionId);
    setChatSessions(nextSessions);

    if (activeSessionId === sessionId) {
      await createNewChatSession();
    }
  };

  const switchChatSession = async (sessionId: string) => {
    chatSessionRef.current = sessionId;
    const msgs = await dbApi.getChatMessagesForSession(sessionId);
    // Batch both updates together AFTER the await so React 18 processes them in one render.
    setActiveSessionId(sessionId);
    setMessages(msgs);
  };

  const clearRecentQueries = async () => {
    await dbApi.clearRecentQueries();
    setRecentQueries([]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeWorkspace) return;

    // Create database session ONLY on the first message sent
    if (!chatSessionRef.current) {
      const autoTitle = text.length > 32 ? text.slice(0, 32) + '...' : text;
      const session = await dbApi.createChatSession(activeWorkspace.id, autoTitle);
      if (session) {
        chatSessionRef.current = session.id;
        setActiveSessionId(session.id);
        setChatSessions(prev => [session, ...prev]);
      }
    }

    // Auto-rename session if it's currently titled 'New Chat' or 'Chat'
    const currentSession = chatSessions.find(s => s.id === chatSessionRef.current);
    if (currentSession && (currentSession.title === 'New Chat' || currentSession.title === 'Chat')) {
      const autoTitle = text.length > 32 ? text.slice(0, 32) + '...' : text;
      renameChatSession(chatSessionRef.current!, autoTitle);
    }

    // Capture chat history before adding the new user message
    const historyForContext = messages.map(m => ({ role: m.role, content: m.content }));

    const userMsgId = await dbApi.saveMessage(chatSessionRef.current!, 'user', text);
    const userMsg: ChatMessage = {
      id: userMsgId || `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);

    const newRq: RecentQuery = {
      id: userMsgId || `rq-${Date.now()}`,
      query: text,
      workspaceId: activeWorkspace.id,
      workspaceName: activeWorkspace.name,
      authorName: currentUser.name,
      timestamp: 'Just now',
    };
    setRecentQueries(prev => [newRq, ...prev]);

    // Keep recent queries synced with Supabase in background
    dbApi.getRecentQueries(50).then(queries => {
      if (queries && queries.length > 0) setRecentQueries(queries);
    });

    setIsSending(true);
    try {
      // If workspace has multiple ready documents and user has not scoped to a single document, prompt user to select a document
      const readyWorkspaceDocs = documents.filter(d => d.workspaceId === activeWorkspace.id && d.status === 'ready');
      if (readyWorkspaceDocs.length > 1 && selectedDocumentIds.length !== 1) {
        const promptScopeMsg = `⚠️ **Multiple Documents Detected**\n\nYour workspace currently contains **${readyWorkspaceDocs.length} documents**. To ensure accurate, dedicated answers and prevent mixing information across different files, please **select a specific document** from the **Query Scope** panel on the left sidebar before asking your question.`;

        const assistantMsgId = await dbApi.saveMessage(chatSessionRef.current!, 'assistant', promptScopeMsg, []);
        setMessages(prev => [...prev, {
          id: assistantMsgId || `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: promptScopeMsg,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        setIsSending(false);
        return;
      }

      // Contextualize query with chat history to resolve referential terms (pronouns/short follow-ups)
      const searchQuery = contextualizeQuery(text, historyForContext);

      // Pass selectedDocumentIds as hard filter
      const sources = await performHybridSearch(
        activeWorkspace.id,
        searchQuery,
        10,
        60,
        selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined
      );

      if (sources.length === 0) {
        const noContextMsg = "Based on your uploaded documents, I could not find relevant information to answer this query. Please ensure your documents are fully indexed (status: Ready) before asking questions.";
        const assistantMsgId = await dbApi.saveMessage(chatSessionRef.current!, 'assistant', noContextMsg, []);
        setMessages(prev => [...prev, {
          id: assistantMsgId || `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: noContextMsg,
          sources: [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
        setIsSending(false);
        return;
      }

      const contextItems = sources.map(s => ({
        id: s.chunkId,
        documentName: s.documentName,
        pageNumber: s.pageNumber,
        content: s.content,
        score: s.rerankScore || s.score,
      }));

      const llmResult = await generateGroundedResponse(text, contextItems, historyForContext, isExpertMode);
      const answerText = llmResult.answer;

      const assistantMsgId = await dbApi.saveMessage(chatSessionRef.current!, 'assistant', answerText, sources);
      const assistantMsg: ChatMessage = {
        id: assistantMsgId || `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: answerText,
        sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[RAG Chat Error]:', err);
      const errText = 'An error occurred while querying the RAG engine. Please try again.';
      const errId = await dbApi.saveMessage(chatSessionRef.current!, 'assistant', errText);
      setMessages(prev => [
        ...prev,
        { id: errId || `msg-err-${Date.now()}`, role: 'assistant', content: errText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const activeWorkspaceMembers = activeWorkspace
    ? members.filter(m => m.workspaceId === activeWorkspace.id)
    : [];

  return (
    <AppContext.Provider value={{
      workspaces, activeWorkspace, setActiveWorkspace, addWorkspace, updateWorkspaceDetails, deleteAllWorkspaceDocuments, deleteWorkspace,
      members: activeWorkspaceMembers, addMember, updateMemberRole, removeMember,
      currentUser, userRole, setUserRole,
      documents, uploadDocument, deleteDocument, reprocessDocument,
      chatSessions: activeWorkspace ? chatSessions.filter(s => s.workspaceId === activeWorkspace.id) : [],
      activeSessionId, messages, recentQueries, clearRecentQueries, sendMessage, isSending,
      isExpertMode, setIsExpertMode,
      createNewChatSession, renameChatSession, deleteChatSession, switchChatSession,
      selectedDocumentIds, setSelectedDocumentIds,
      activeScreen, setActiveScreen, activeTab, setActiveTab
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
