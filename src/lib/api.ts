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

  async updateDocumentStatus(docId: string, status: DocumentItem['status'], chunkCount: number, pageCount?: number): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const payload: Record<string, any> = { status, chunk_count: chunkCount };
    if (typeof pageCount === 'number' && pageCount > 0) {
      payload.pages = pageCount;
    }
    const { error } = await supabase.from('documents').update(payload).eq('id', docId);
    if (error) console.error('[api] updateDocumentStatus:', error.message);
  },

  async deleteDocument(docId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    // Delete associated chunks first (foreign key cascade may not be enabled)
    await supabase.from('document_chunks').delete().eq('document_id', docId);
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    if (error) console.error('[api] deleteDocument:', error.message);
  },

  async deleteAllWorkspaceDocuments(workspaceId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('document_chunks').delete().eq('workspace_id', workspaceId);
    const { error } = await supabase.from('documents').delete().eq('workspace_id', workspaceId);
    if (error) console.error('[api] deleteAllWorkspaceDocuments:', error.message);
  },

  // ══════════════════════════════════════════════════════════════════
  // DOCUMENT CHUNKS (PERSISTED TO SUPABASE)
  // ══════════════════════════════════════════════════════════════════

  async saveDocumentChunks(workspaceId: string, docId: string, chunks: { chunkIndex: number; content: string; embedding?: number[]; pageNumber?: number }[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase || chunks.length === 0) return;
    try {
      // Deduplicate: delete any existing chunks for this document before inserting
      await supabase.from('document_chunks').delete().eq('document_id', docId);

      const rows = chunks.map(c => ({
        workspace_id: workspaceId,
        document_id: docId,
        chunk_index: c.chunkIndex,
        content: c.content,
        embedding: c.embedding && c.embedding.length > 0 ? c.embedding : null,
        page_number: c.pageNumber || 1,
      }));

      // Batch insert in chunks of 100 rows to prevent HTTP payload size limits on 500+ page PDFs
      const BATCH_SIZE = 100;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('document_chunks').insert(batch);
        if (error) console.error(`[api] saveDocumentChunks batch ${i / BATCH_SIZE + 1}:`, error.message);
      }
    } catch (err) {
      console.warn('[api] saveDocumentChunks failed:', err);
    }
  },

  async deleteDocumentChunks(docId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from('document_chunks').delete().eq('document_id', docId);
      if (error) console.error('[api] deleteDocumentChunks:', error.message);
    } catch (err) {
      console.warn('[api] deleteDocumentChunks failed:', err);
    }
  },

  async getWorkspaceChunks(workspaceId: string): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('workspace_id', workspaceId);
      if (error) { console.warn('[api] getWorkspaceChunks:', error.message); return []; }
      return data || [];
    } catch (err) {
      console.warn('[api] getWorkspaceChunks failed:', err);
      return [];
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // WORKSPACE MEMBERS
  // ══════════════════════════════════════════════════════════════════
  // WORKSPACE MEMBERS & RBAC GOVERNANCE
  // ══════════════════════════════════════════════════════════════════

  async getUserRoleForWorkspace(workspaceId: string): Promise<'owner' | 'editor' | 'viewer'> {
    if (!isSupabaseConfigured || !supabase) return 'owner';
    const userId = await getAuthUserId();
    if (!userId) return 'owner';

    try {
      // 1. Check if user is explicit workspace owner
      const { data: ws } = await supabase
        .from('workspaces')
        .select('owner_id')
        .eq('id', workspaceId)
        .single();

      if (ws && ws.owner_id === userId) return 'owner';

      // 2. Query workspace_members for user's assigned role
      const { data: member } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle();

      if (member?.role) return member.role as 'owner' | 'editor' | 'viewer';
      return 'owner'; // Default fallback for workspace creator/solo tenant
    } catch (err) {
      console.warn('[api] getUserRoleForWorkspace failed:', err);
      return 'owner';
    }
  },

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
      name: row.users?.name || 'Team Member',
      email: row.users?.email || '',
      role: row.role as 'owner' | 'editor' | 'viewer',
      joinedAt: new Date(row.joined_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isYou: row.user_id === currentUserId,
    }));
  },

  async addMember(workspaceId: string, email: string, role: 'owner' | 'editor' | 'viewer'): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return `m-${Date.now()}`;

    const cleanEmail = email.trim().toLowerCase();

    try {
      // 1. Find target user ID by email in users table if already registered
      const { data: targetUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      const currentUserId = await getAuthUserId();
      const targetUserId = targetUser?.id || currentUserId;
      if (!targetUserId) return `m-${Date.now()}`;

      // 2. Insert into workspace_members table
      const { data, error } = await supabase
        .from('workspace_members')
        .insert({ workspace_id: workspaceId, user_id: targetUserId, role })
        .select('id')
        .single();

      if (error && !error.message.includes('duplicate')) {
        console.error('[api] addMember:', error.message);
      }

      // 3. Trigger Supabase Auth real email dispatch (Magic Link / Invitation) to target email address
      try {
        await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
          },
        });
      } catch (emailErr) {
        console.warn('[api] Supabase Auth Email dispatch warning:', emailErr);
      }

      return data?.id || `m-${Date.now()}`;
    } catch (err) {
      console.warn('[api] addMember fallback:', err);
      return `m-${Date.now()}`;
    }
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

  async getChatSessions(workspaceId: string): Promise<{ id: string; workspaceId: string; title: string; updatedAt: string }[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    const userId = await getAuthUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) { console.warn('[api] getChatSessions:', error.message); return []; }

    return (data || []).map(row => ({
      id: row.id,
      workspaceId: row.workspace_id,
      title: row.title || 'New Chat',
      updatedAt: new Date(row.updated_at || row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  },

  async createChatSession(workspaceId: string, title = 'New Chat'): Promise<{ id: string; workspaceId: string; title: string; updatedAt: string } | null> {
    if (!isSupabaseConfigured || !supabase) {
      return { id: `cs-${Date.now()}`, workspaceId, title, updatedAt: 'Just now' };
    }
    const userId = await getAuthUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ workspace_id: workspaceId, user_id: userId, title })
      .select()
      .single();

    if (error) { console.error('[api] createChatSession:', error.message); return null; }

    return {
      id: data.id,
      workspaceId: data.workspace_id,
      title: data.title || title,
      updatedAt: 'Just now',
    };
  },

  async renameChatSession(sessionId: string, title: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.from('chat_sessions').update({ title, updated_at: new Date().toISOString() }).eq('id', sessionId);
    if (error) console.error('[api] renameChatSession:', error.message);
  },

  async deleteChatSession(sessionId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    // Delete associated chat messages first
    await supabase.from('chat_messages').delete().eq('session_id', sessionId);
    const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId);
    if (error) console.error('[api] deleteChatSession:', error.message);
  },

  /** Get or create a chat session for the current user in the given workspace. */
  async getOrCreateChatSession(workspaceId: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const userId = await getAuthUserId();
    if (!userId) return null;

    const { data: existing } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing?.id) return existing.id;

    const session = await this.createChatSession(workspaceId, 'New Chat');
    return session?.id || null;
  },

  async getChatMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) { console.warn('[api] getChatMessagesForSession:', error.message); return []; }

    const msgs: ChatMessage[] = (data || []).map(row => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      sources: row.sources || [],
      timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    // ── Full Chat History Healing & Repair Guard ──────────────────────────────
    // Ensures every assistant message is preceded by a corresponding user prompt.
    // If user prompt rows were deleted or missing in DB, repair them automatically.
    const repairedMsgs: ChatMessage[] = [];

    const extractPromptFromAssistant = (content: string, defaultTitle?: string): string => {
      // Look for main title heading e.g. "Introduction to Computer-Assisted Surgery"
      const match = content.match(/(?:^|\n)(?:#+|\*\*)\s*([^\n*#]{4,80})/);
      if (match && match[1]) {
        const title = match[1].replace(/^Introduction to\s+/i, '').replace(/^Overview of\s+/i, '').trim();
        return `Tell me about ${title}`;
      }
      if (defaultTitle && defaultTitle !== 'New Chat' && defaultTitle !== 'Chat') {
        return defaultTitle;
      }
      return 'Can you explain this topic from the document?';
    };

    let sessionTitle = '';
    if (msgs.length > 0) {
      try {
        const { data: sessData } = await supabase
          .from('chat_sessions')
          .select('title')
          .eq('id', sessionId)
          .single();
        if (sessData?.title) sessionTitle = sessData.title;
      } catch {}
    }

    for (let i = 0; i < msgs.length; i++) {
      const curr = msgs[i];
      const prev = repairedMsgs.length > 0 ? repairedMsgs[repairedMsgs.length - 1] : null;

      if (curr.role === 'assistant') {
        if (!prev || prev.role !== 'user') {
          // Found an orphan assistant message (no preceding user query)!
          const promptText = (i === 0 && sessionTitle && sessionTitle !== 'New Chat' && sessionTitle !== 'Chat')
            ? sessionTitle
            : extractPromptFromAssistant(curr.content, sessionTitle);

          const restoredUserMsg: ChatMessage = {
            id: `restored-user-${sessionId}-${i}`,
            role: 'user',
            content: promptText,
            timestamp: curr.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          // Re-insert into Supabase DB so it is permanently stored back
          supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'user',
            content: promptText,
            created_at: new Date().toISOString()
          }).then(({ error }) => {
            if (error) console.warn('[api] Failed to persist repaired user message:', error.message);
          });

          repairedMsgs.push(restoredUserMsg);
        }
      }

      repairedMsgs.push(curr);
    }

    return repairedMsgs;
  },

  async getChatMessages(workspaceId: string): Promise<ChatMessage[]> {
    const sessionId = await this.getOrCreateChatSession(workspaceId);
    if (!sessionId) return [];
    return this.getChatMessagesForSession(sessionId);
  },

  async deleteMessagesForDocument(workspaceId: string, docId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // Find chat sessions for this workspace
      const { data: sessions } = await supabase.from('chat_sessions').select('id').eq('workspace_id', workspaceId);
      if (!sessions || sessions.length === 0) return;
      const sessionIds = sessions.map(s => s.id);

      // Fetch messages for these sessions
      const { data: msgs } = await supabase.from('chat_messages').select('id, sources').in('session_id', sessionIds);
      if (!msgs) return;

      // Identify messages whose sources match docId
      const toDeleteIds = msgs
        .filter(m => Array.isArray(m.sources) && m.sources.some((s: any) => s.documentId === docId))
        .map(m => m.id);

      if (toDeleteIds.length > 0) {
        await supabase.from('chat_messages').delete().in('id', toDeleteIds);
      }
    } catch (err) {
      console.warn('[api] deleteMessagesForDocument failed:', err);
    }
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

  async clearRecentQueries(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('docly_recent_queries_cleared_at', new Date().toISOString());
      }
    } catch (err) {
      console.warn('[api] clearRecentQueries failed:', err);
    }
  },

  async getRecentQueries(limit = 50): Promise<RecentQuery[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      let clearedAtStr: string | null = null;
      if (typeof window !== 'undefined') {
        clearedAtStr = localStorage.getItem('docly_recent_queries_cleared_at');
      }

      let baseQuery = supabase
        .from('chat_messages')
        .select('id, content, created_at, session_id, chat_sessions(workspace_id, workspaces(name))')
        .eq('role', 'user');

      if (clearedAtStr) {
        baseQuery = baseQuery.gt('created_at', clearedAtStr);
      }

      const { data, error } = await baseQuery
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        let simpleQuery = supabase
          .from('chat_messages')
          .select('id, content, created_at')
          .eq('role', 'user');

        if (clearedAtStr) {
          simpleQuery = simpleQuery.gt('created_at', clearedAtStr);
        }

        const { data: simpleData } = await simpleQuery
          .order('created_at', { ascending: false })
          .limit(limit);

        return (simpleData || []).map((row: any) => ({
          id: row.id,
          query: row.content,
          workspaceId: '',
          workspaceName: 'Workspace',
          authorName: 'You',
          timestamp: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        query: row.content,
        workspaceId: row.chat_sessions?.workspace_id || '',
        workspaceName: row.chat_sessions?.workspaces?.name || 'Workspace',
        authorName: 'You',
        timestamp: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
    } catch (err) {
      console.warn('[api] getRecentQueries failed:', err);
      return [];
    }
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
