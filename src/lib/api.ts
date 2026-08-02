import { supabase, isSupabaseConfigured } from './supabase';
import type { Workspace, DocumentItem, WorkspaceMember, RecentQuery, ChatMessage } from '../context/AppContext';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: resolve the current auth user ID (returns null if not signed in)
// ─────────────────────────────────────────────────────────────────────────────
async function getAuthUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export interface DashboardLiveStats {
  workspaceCount: number;
  documentCount: number;
  queryCount: number;
  memberCount: number;
}

export const dbApi = {

  // ══════════════════════════════════════════════════════════════════
  // WORKSPACES
  // ══════════════════════════════════════════════════════════════════

  async getWorkspaces(): Promise<Workspace[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const userId = await getAuthUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) { console.warn('[api] getWorkspaces:', error.message); return []; }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      slug: row.slug,
      role: 'owner' as const,
      tier: (row.tier || 'free') as 'free' | 'pro' | 'enterprise',
      docCount: 0,
      memberCount: 0,
      queryCount: 0,
      updatedAt: new Date(row.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: row.color || '#2563eb',
    }));
  },

  async createWorkspace(name: string, description?: string): Promise<Workspace | null> {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const color = '#2563eb';

    if (!isSupabaseConfigured || !supabase) {
      return { id: `ws-${Date.now()}`, name, description: description || '', slug, role: 'owner', tier: 'free', updatedAt: 'Just now', color, docCount: 0, memberCount: 1, queryCount: 0 };
    }

    const userId = await getAuthUserId();
    if (!userId) { console.error('[api] createWorkspace: no auth user'); return null; }

    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, slug: `${slug}-${Date.now().toString().slice(-4)}`, description: description || '', color, tier: 'free', owner_id: userId })
      .select()
      .single();

    if (error) { console.error('[api] createWorkspace:', error.message); return null; }

    return {
      id: data.id, name: data.name, description: data.description || '',
      slug: data.slug, role: 'owner', tier: (data.tier || 'free') as 'free' | 'pro' | 'enterprise',
      updatedAt: 'Just now', color: data.color || color, docCount: 0, memberCount: 1, queryCount: 0,
    };
  },

  async updateWorkspace(workspaceId: string, name: string, description: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { error } = await supabase.from('workspaces').update({ name, description, slug, updated_at: new Date().toISOString() }).eq('id', workspaceId);
    if (error) console.error('[api] updateWorkspace:', error.message);
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('workspaces').delete().eq('id', workspaceId);
    if (error) console.error('[api] deleteWorkspace:', error.message);
  },

  // ══════════════════════════════════════════════════════════════════
  // DOCUMENTS
  // ══════════════════════════════════════════════════════════════════

  async getDocuments(workspaceId: string): Promise<DocumentItem[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const userId = await getAuthUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) { console.warn('[api] getDocuments:', error.message); return []; }

    return (data || []).map(row => ({
      id: row.id,
      workspaceId: row.workspace_id,
      filename: row.filename,
      fileSize: row.file_size,
      pages: row.pages || 1,
      mimeType: row.mime_type,
      status: (row.status || 'ready') as DocumentItem['status'],
      chunkCount: row.chunk_count || 0,
      uploadedAt: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }));
  },

  async createDocument(workspaceId: string, file: File): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return `doc-${Date.now()}`;
    const userId = await getAuthUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('documents')
      .insert({
        workspace_id: workspaceId,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type || 'application/pdf',
        storage_key: `${workspaceId}/${Date.now()}_${file.name}`,
        status: 'uploading',
        uploaded_by: userId,
        chunk_count: 0,
      })
      .select('id')
      .single();

    if (error) { console.error('[api] createDocument:', error.message); return null; }
    return data.id;
  },

  async updateDocumentStatus(docId: string, status: DocumentItem['status'], chunkCount: number): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('documents').update({ status, chunk_count: chunkCount }).eq('id', docId);
    if (error) console.error('[api] updateDocumentStatus:', error.message);
  },

  async deleteDocument(docId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    if (error) console.error('[api] deleteDocument:', error.message);
  },

  // ══════════════════════════════════════════════════════════════════
  // WORKSPACE MEMBERS
  // ══════════════════════════════════════════════════════════════════

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const currentUserId = await getAuthUserId();

    // Join workspace_members with users to get name + email
    const { data, error } = await supabase
      .from('workspace_members')
      .select('id, role, joined_at, user_id, users(name, email)')
      .eq('workspace_id', workspaceId);

    if (error) { console.warn('[api] getMembers:', error.message); return []; }

    return (data || []).map((row: any) => ({
      id: row.id,
      workspaceId,
      name: row.users?.name || 'Unknown',
      email: row.users?.email || '',
      role: row.role as 'owner' | 'editor' | 'viewer',
      joinedAt: new Date(row.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isYou: row.user_id === currentUserId,
    }));
  },

  async addMember(workspaceId: string, userId: string, role: 'owner' | 'editor' | 'viewer'): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return `m-${Date.now()}`;

    const { data, error } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: workspaceId, user_id: userId, role })
      .select('id')
      .single();

    if (error) { console.error('[api] addMember:', error.message); return null; }
    return data.id;
  },

  async updateMemberRole(memberId: string, role: 'owner' | 'editor' | 'viewer'): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('workspace_members').update({ role }).eq('id', memberId);
    if (error) console.error('[api] updateMemberRole:', error.message);
  },

  async removeMember(memberId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('workspace_members').delete().eq('id', memberId);
    if (error) console.error('[api] removeMember:', error.message);
  },

  // ══════════════════════════════════════════════════════════════════
  // CHAT SESSIONS + MESSAGES
  // ══════════════════════════════════════════════════════════════════

  /** Get or create a chat session for the current user in the given workspace. */
  async getOrCreateChatSession(workspaceId: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const userId = await getAuthUserId();
    if (!userId) return null;

    // Try to find an existing session for this user in this workspace
    const { data: existing } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing?.id) return existing.id;

    // No session yet — create one
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ workspace_id: workspaceId, user_id: userId, title: 'Chat' })
      .select('id')
      .single();

    if (error) { console.error('[api] getOrCreateChatSession:', error.message); return null; }
    return data.id;
  },

  async getChatMessages(workspaceId: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const userId = await getAuthUserId();
    if (!userId) return [];

    // Get the most recent session for this user + workspace
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!session?.id) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (error) { console.warn('[api] getChatMessages:', error.message); return []; }

    return (data || []).map(row => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      sources: row.sources || [],
      timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  },

  async saveMessage(sessionId: string, role: 'user' | 'assistant', content: string, sources: any[] = []): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ session_id: sessionId, role, content, sources })
      .select('id')
      .single();

    if (error) { console.error('[api] saveMessage:', error.message); return null; }
    return data.id;
  },

  async getRecentQueries(limit = 10): Promise<RecentQuery[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const userId = await getAuthUserId();
    if (!userId) return [];

    // Fetch user messages across all their sessions (joined with session+workspace for names)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, content, created_at, chat_sessions(workspace_id, workspaces(name))')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) { console.warn('[api] getRecentQueries:', error.message); return []; }

    return (data || []).map((row: any) => ({
      id: row.id,
      query: row.content,
      workspaceId: row.chat_sessions?.workspace_id || '',
      workspaceName: row.chat_sessions?.workspaces?.name || 'Unknown',
      authorName: 'You',
      timestamp: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
  },

  // ══════════════════════════════════════════════════════════════════
  // DASHBOARD LIVE STATS
  // ══════════════════════════════════════════════════════════════════

  async getLiveStats(): Promise<DashboardLiveStats> {
    if (!isSupabaseConfigured || !supabase) return { workspaceCount: 0, documentCount: 0, queryCount: 0, memberCount: 0 };

    try {
      const userId = await getAuthUserId();
      if (!userId) return { workspaceCount: 0, documentCount: 0, queryCount: 0, memberCount: 0 };

      const [{ count: wsCount }, { count: docCount }, { count: queryCount }, { count: memberCount }] = await Promise.all([
        supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('workspace_members').select('*', { count: 'exact', head: true }),
      ]);

      return { workspaceCount: wsCount || 0, documentCount: docCount || 0, queryCount: queryCount || 0, memberCount: memberCount || 0 };
    } catch (err) {
      console.warn('[api] getLiveStats:', err);
      return { workspaceCount: 0, documentCount: 0, queryCount: 0, memberCount: 0 };
    }
  },
};
