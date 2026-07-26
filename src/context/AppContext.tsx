import React, { createContext, useContext, useState, useEffect } from 'react';
import { processDocumentIngestion } from '../lib/ingestion/pipeline';
import { performHybridSearch, RetrievalResult, globalVectorIndex } from '../lib/rag/hybrid-retrieval';

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
  addWorkspace: (name: string, description?: string) => void;
  updateWorkspaceDetails: (workspaceId: string, name: string, description: string) => void;
  deleteAllWorkspaceDocuments: (workspaceId: string) => void;
  deleteWorkspace: (workspaceId: string) => void;

  // Members
  members: WorkspaceMember[];
  addMember: (name: string, email: string, role: UserRole) => void;
  updateMemberRole: (memberId: string, role: UserRole) => void;
  removeMember: (memberId: string) => void;

  // User / Role
  currentUser: { name: string; email: string };
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;

  // Documents
  documents: DocumentItem[];
  uploadDocument: (file: File) => Promise<void>;
  deleteDocument: (docId: string) => void;

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

// ── Workspace color palette ──────────────────────────────────────────────
const WORKSPACE_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#4f46e5', '#be185d'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── ALL STATE STARTS EMPTY — no mock data ───────────────────────────
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

  // Current user — will be replaced by Supabase Auth in Phase 2
  const currentUser = { name: 'Sanjeev', email: 'sanjeev@docmind.ai' };

  // Safe active workspace setter
  const setActiveWorkspace = (ws: Workspace) => {
    setActiveWorkspaceState(ws);
  };

  // Sync activeWorkspace state with list updates
  useEffect(() => {
    if (activeWorkspace) {
      const updated = workspaces.find(w => w.id === activeWorkspace.id);
      if (updated) {
        setActiveWorkspaceState(updated);
      } else if (workspaces.length > 0) {
        setActiveWorkspaceState(workspaces[0]);
      } else {
        setActiveWorkspaceState(null);
      }
    }
  }, [workspaces]);

  // Compute workspace counts dynamically based on actual arrays
  const enrichedWorkspaces = workspaces.map(ws => {
    const wsDocs = documents.filter(d => d.workspaceId === ws.id);
    const wsMembers = members.filter(m => m.workspaceId === ws.id);
    const wsQueries = recentQueries.filter(q => q.workspaceId === ws.id);
    return {
      ...ws,
      docCount: wsDocs.length,
      memberCount: wsMembers.length,
      queryCount: wsQueries.length,
    };
  });

  const enrichedActiveWorkspace = activeWorkspace
    ? enrichedWorkspaces.find(w => w.id === activeWorkspace.id) || null
    : null;

  // ── Workspace CRUD ──────────────────────────────────────────────────
  const addWorkspace = (name: string, description?: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      description: description || '',
      slug,
      role: 'owner',
      tier: 'free',
      updatedAt: 'Just now',
      color: WORKSPACE_COLORS[workspaces.length % WORKSPACE_COLORS.length],
      docCount: 0,
      memberCount: 0,
      queryCount: 0,
    };
    setWorkspaces(prev => [newWs, ...prev]);
    setActiveWorkspaceState(newWs);

    // Auto-create owner member for the new workspace
    const newMem: WorkspaceMember = {
      id: `u-${Date.now()}`,
      workspaceId: newWs.id,
      name: currentUser.name,
      email: currentUser.email,
      role: 'owner',
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isYou: true,
    };
    setMembers(prev => [...prev, newMem]);
  };

  const updateWorkspaceDetails = (workspaceId: string, name: string, description: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setWorkspaces(prev => prev.map(w => w.id === workspaceId ? { ...w, name, description, slug, updatedAt: 'Just now' } : w));
  };

  const deleteAllWorkspaceDocuments = (workspaceId: string) => {
    globalVectorIndex.clearWorkspace(workspaceId);
    setDocuments(prev => prev.filter(d => d.workspaceId !== workspaceId));
  };

  const deleteWorkspace = (workspaceId: string) => {
    globalVectorIndex.clearWorkspace(workspaceId);
    setDocuments(prev => prev.filter(d => d.workspaceId !== workspaceId));
    setRecentQueries(prev => prev.filter(rq => rq.workspaceId !== workspaceId));
    setMembers(prev => prev.filter(m => m.workspaceId !== workspaceId));
    setWorkspaces(prev => {
      const next = prev.filter(w => w.id !== workspaceId);
      if (activeWorkspace?.id === workspaceId) {
        setActiveWorkspaceState(next.length > 0 ? next[0] : null);
      }
      return next;
    });
  };

  // ── Members CRUD ────────────────────────────────────────────────────
  const addMember = (name: string, email: string, role: UserRole) => {
    if (!activeWorkspace) return;
    const newMem: WorkspaceMember = {
      id: `u-${Date.now()}`,
      workspaceId: activeWorkspace.id,
      name,
      email,
      role,
      joinedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    setMembers(prev => [...prev, newMem]);
  };

  const updateMemberRole = (memberId: string, role: UserRole) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const removeMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  // ── Document Upload ─────────────────────────────────────────────────
  const uploadDocument = async (file: File) => {
    if (!activeWorkspace) return;
    if (userRole === 'viewer') {
      alert('Permission Denied: Viewer role cannot upload documents.');
      return;
    }
    const docId = `doc-${Date.now()}`;
    const estPages = Math.max(1, Math.ceil(file.size / 30000));
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
      const arrayBuffer = await file.arrayBuffer();
      const result = await processDocumentIngestion(activeWorkspace.id, docId, file.name, arrayBuffer, file.type);
      setDocuments(prev =>
        prev.map(d => d.id === docId ? { ...d, status: result.status, chunkCount: result.chunkCount } : d)
      );
    } catch {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'failed' } : d));
    }
  };

  const deleteDocument = (docId: string) => {
    if (userRole === 'viewer') {
      alert('Permission Denied: Viewer role cannot delete documents.');
      return;
    }
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // ── Chat / Send Message ─────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeWorkspace) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);

    // Add to recent queries
    const newRq: RecentQuery = {
      id: `rq-${Date.now()}`,
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
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: answerText,
        sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `msg-err-${Date.now()}`, role: 'assistant', content: 'An error occurred during retrieval.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Filter members list based on the active workspace selection
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
