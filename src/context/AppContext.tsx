import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { processDocumentIngestion } from '../lib/ingestion/pipeline';
import { performHybridSearch, RetrievalResult, globalVectorIndex } from '../lib/rag/hybrid-retrieval';
import { dbApi } from '../lib/api';
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

  // Chat & Recent Queries
  messages: ChatMessage[];
  recentQueries: RecentQuery[];
  sendMessage: (text: string) => Promise<void>;
  isSending: boolean;

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string }>({ name: 'User', email: '' });

  // Track the current chat session ID so messages append to the same session
  const chatSessionRef = useRef<string | null>(null);

  // ── Safe active workspace setter ───────────────────────────────────────
  const setActiveWorkspace = async (ws: Workspace) => {
    setActiveWorkspaceState(ws);
    // Load documents, members, and chat messages for the newly selected workspace
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
    const [dbDocs, dbMembers, dbMessages, dbSession] = await Promise.all([
      dbApi.getDocuments(workspaceId),
      dbApi.getMembers(workspaceId),
      dbApi.getChatMessages(workspaceId),
      dbApi.getOrCreateChatSession(workspaceId),
    ]);
    setDocuments(dbDocs);
    setMembers(dbMembers);
    setMessages(dbMessages);
    chatSessionRef.current = dbSession;
  };

  // ── Bootstrap: auth state listener loads everything on sign-in ─────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const bootstrap = async () => {
      // Resolve current user info
      const { data: { session } } = await supabase!.auth.getSession();
      if (session?.user) {
        const meta = session.user.user_metadata;
        setCurrentUser({
          name: meta?.full_name || meta?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
      }

      // Load workspaces (scoped to the logged-in user)
      const dbWorkspaces = await dbApi.getWorkspaces();
      setWorkspaces(dbWorkspaces);

      // Load data for the first workspace if any
      if (dbWorkspaces.length > 0) {
        const first = dbWorkspaces[0];
        setActiveWorkspaceState(first);
        await loadWorkspaceData(first.id);

        // Also load recent queries from all workspaces
        const dbQueries = await dbApi.getRecentQueries(20);
        setRecentQueries(dbQueries);
      }
    };

    // Run immediately to handle page refresh with active session
    bootstrap();

    // Re-run whenever auth state changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const meta = session.user.user_metadata;
        setCurrentUser({
          name: meta?.full_name || meta?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        });
        await bootstrap();
      } else if (event === 'SIGNED_OUT') {
        // Clear ALL local state on sign out
        setWorkspaces([]);
        setActiveWorkspaceState(null);
        setDocuments([]);
        setMembers([]);
        setRecentQueries([]);
        setMessages([]);
        chatSessionRef.current = null;
        setCurrentUser({ name: 'User', email: '' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Compute enriched counts dynamically ───────────────────────────────
  const enrichedWorkspaces = workspaces.map(ws => {
    const wsDocs = documents.filter(d => d.workspaceId === ws.id);
    const wsMembers = members.filter(m => m.workspaceId === ws.id);
    const wsQueries = recentQueries.filter(q => q.workspaceId === ws.id);
    return { ...ws, docCount: wsDocs.length, memberCount: wsMembers.length, queryCount: wsQueries.length };
  });

  const enrichedActiveWorkspace = activeWorkspace
    ? enrichedWorkspaces.find(w => w.id === activeWorkspace.id) || null
    : null;

  // ══════════════════════════════════════════════════════════════════
  // WORKSPACE CRUD
  // ══════════════════════════════════════════════════════════════════

  const addWorkspace = async (name: string, description?: string) => {
    const createdWs = await dbApi.createWorkspace(name, description);
    if (!createdWs) { console.error('Failed to create workspace in Supabase'); return; }
    setWorkspaces(prev => [createdWs, ...prev]);
    setActiveWorkspaceState(createdWs);
    // Immediately load (empty) data for the new workspace and create chat session
    await loadWorkspaceData(createdWs.id);
  };

  const updateWorkspaceDetails = async (workspaceId: string, name: string, description: string): Promise<void> => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await dbApi.updateWorkspace(workspaceId, name, description); // persist to Supabase
    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, name, description, slug, updatedAt: 'Just now' } : w));
  };

  const deleteAllWorkspaceDocuments = async (workspaceId: string) => {
    globalVectorIndex.clearWorkspace(workspaceId);
    // Delete each document from Supabase
    const wsDocs = documents.filter(d => d.workspaceId === workspaceId);
    await Promise.all(wsDocs.map(d => dbApi.deleteDocument(d.id)));
    setDocuments(prev => prev.filter(d => d.workspaceId !== workspaceId));
  };

  const deleteWorkspace = async (workspaceId: string) => {
    await dbApi.deleteWorkspace(workspaceId); // Supabase CASCADE will delete docs, members, sessions, messages
    globalVectorIndex.clearWorkspace(workspaceId);
    setDocuments(prev => prev.filter(d => d.workspaceId !== workspaceId));
    setRecentQueries(prev => prev.filter(rq => rq.workspaceId !== workspaceId));
    setMembers(prev => prev.filter(m => m.workspaceId !== workspaceId));
    setWorkspaces(prev => {
      const next = prev.filter(w => w.id !== workspaceId);
      if (activeWorkspace?.id === workspaceId) {
        const nextActive = next.length > 0 ? next[0] : null;
        setActiveWorkspaceState(nextActive);
        if (nextActive) loadWorkspaceData(nextActive.id);
        else { setDocuments([]); setMembers([]); setMessages([]); }
      }
      return next;
    });
  };

  // ══════════════════════════════════════════════════════════════════
  // MEMBERS CRUD
  // ══════════════════════════════════════════════════════════════════

  const addMember = async (name: string, email: string, role: UserRole) => {
    if (!activeWorkspace) return;
    // In a full app you'd look up userId by email. For now add locally.
    const newMem: WorkspaceMember = {
      id: `m-${Date.now()}`,
      workspaceId: activeWorkspace.id,
      name,
      email,
      role,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setMembers(prev => [...prev, newMem]);
  };

  const updateMemberRole = async (memberId: string, role: UserRole) => {
    await dbApi.updateMemberRole(memberId, role);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const removeMember = async (memberId: string) => {
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

    // 1. Create DB record immediately (status = uploading)
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
      // 2. Switch to processing
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'processing' } : d));
      await dbApi.updateDocumentStatus(docId, 'processing', 0);

      // 3. Run ingestion pipeline
      const arrayBuffer = await file.arrayBuffer();
      const result = await processDocumentIngestion(activeWorkspace.id, docId, file.name, arrayBuffer, file.type);

      // 4. Update status to ready + chunk count
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: result.status, chunkCount: result.chunkCount } : d));
      await dbApi.updateDocumentStatus(docId, result.status, result.chunkCount);
    } catch {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'failed' } : d));
      await dbApi.updateDocumentStatus(docId, 'failed', 0);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (userRole === 'viewer') { alert('Permission Denied: Viewer role cannot delete documents.'); return; }
    await dbApi.deleteDocument(docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // ══════════════════════════════════════════════════════════════════
  // CHAT MESSAGES
  // ══════════════════════════════════════════════════════════════════

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeWorkspace) return;

    // Ensure we have a chat session
    if (!chatSessionRef.current) {
      chatSessionRef.current = await dbApi.getOrCreateChatSession(activeWorkspace.id);
    }

    // Save and display the user message
    const userMsgId = await dbApi.saveMessage(chatSessionRef.current!, 'user', text);
    const userMsg: ChatMessage = {
      id: userMsgId || `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);

    // Add to recent queries
    const newRq: RecentQuery = {
      id: userMsgId || `rq-${Date.now()}`,
      query: text,
      workspaceId: activeWorkspace.id,
      workspaceName: activeWorkspace.name,
      authorName: currentUser.name,
      timestamp: 'Just now',
    };
    setRecentQueries(prev => [newRq, ...prev]);

    setIsSending(true);
    try {
      const sources = await performHybridSearch(activeWorkspace.id, text, 3, 60);
      let answerText = '';
      if (sources.length === 0) {
        answerText = "I searched your workspace documents but couldn't find relevant information matching your query. Try uploading more documents or rephrasing your question.";
      } else {
        const top = sources[0];
        answerText = `Based on the documents in ${activeWorkspace.name}, ${top.content.slice(0, 500)}`;
      }
      const assistantMsgId = await dbApi.saveMessage(chatSessionRef.current!, 'assistant', answerText, sources);
      const assistantMsg: ChatMessage = {
        id: assistantMsgId || `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: answerText,
        sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errId = await dbApi.saveMessage(chatSessionRef.current!, 'assistant', 'An error occurred during retrieval.');
      setMessages(prev => [
        ...prev,
        { id: errId || `msg-err-${Date.now()}`, role: 'assistant', content: 'An error occurred during retrieval.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // ── Filter members list to active workspace ────────────────────────────
  const activeWorkspaceMembers = activeWorkspace
    ? members.filter(m => m.workspaceId === activeWorkspace.id)
    : [];

  return (
    <AppContext.Provider value={{
      workspaces: enrichedWorkspaces,
      activeWorkspace: enrichedActiveWorkspace,
      setActiveWorkspace,
      addWorkspace,
      updateWorkspaceDetails,
      deleteAllWorkspaceDocuments,
      deleteWorkspace,
      members: activeWorkspaceMembers,
      addMember,
      updateMemberRole,
      removeMember,
      currentUser,
      userRole,
      setUserRole,
      documents,
      uploadDocument,
      deleteDocument,
      messages,
      recentQueries,
      sendMessage,
      isSending,
      activeScreen,
      setActiveScreen,
      activeTab,
      setActiveTab,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
