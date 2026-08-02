import { supabase, isSupabaseConfigured } from './supabase';
import { Workspace, DocumentItem, WorkspaceMember, RecentQuery, ChatMessage } from '../context/AppContext';

export interface DashboardLiveStats {
  workspaceCount: number;
  documentCount: number;
  queryCount: number;
  memberCount: number;
}

export const dbApi = {
  // ── WORKSPACES ──────────────────────────────────────────────────────────

  /** Fetch only the workspaces owned by (or shared with) the current auth user. */
  async getWorkspaces(): Promise<Workspace[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      // Get the current authenticated session to know the user's ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];

      const userId = session.user.id;

      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId)          // ← ONLY this user's workspaces
        .order('created_at', { ascending: false });

      if (error) throw error;

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
        updatedAt: new Date(row.updated_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric',
        }),
        color: row.color || '#2563eb',
      }));
    } catch (err) {
      console.warn('Supabase fetch workspaces failed, fallback to local state:', err);
      return [];
    }
  },

  /** Create a workspace for the CURRENT authenticated user. */
  async createWorkspace(name: string, description?: string): Promise<Workspace | null> {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const color = '#2563eb';

    if (!isSupabaseConfigured || !supabase) {
      // Offline fallback — works without Supabase configured
      return {
        id: `ws-${Date.now()}`,
        name,
        description: description || '',
        slug,
        role: 'owner',
        tier: 'free',
        updatedAt: 'Just now',
        color,
        docCount: 0,
        memberCount: 1,
        queryCount: 0,
      };
    }

    try {
      // Resolve the real user ID from the active session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user found');

      const userId = session.user.id;

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          description: description || '',
          color,
          tier: 'free',
          owner_id: userId,     // ← Real auth user ID, NOT hardcoded
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description || '',
        slug: data.slug,
        role: 'owner',
        tier: (data.tier || 'free') as 'free' | 'pro' | 'enterprise',
        updatedAt: 'Just now',
        color: data.color || color,
        docCount: 0,
        memberCount: 1,
        queryCount: 0,
      };
    } catch (err) {
      console.error('Supabase workspace creation failed:', err);
      return null;
    }
  },

  /** Delete a workspace by ID (only works if user owns it, enforced by RLS). */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('workspaces').delete().eq('id', workspaceId);
    } catch (err) {
      console.error('Supabase delete workspace failed:', err);
    }
  },

  /** Update workspace name/description by ID. */
  async updateWorkspace(workspaceId: string, name: string, description: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await supabase.from('workspaces').update({ name, description, slug }).eq('id', workspaceId);
    } catch (err) {
      console.error('Supabase update workspace failed:', err);
    }
  },

  // ── LIVE STATS (SQL COUNT QUERIES) ──────────────────────────────────────
  async getLiveStats(): Promise<DashboardLiveStats> {
    if (!isSupabaseConfigured || !supabase) {
      return { workspaceCount: 0, documentCount: 0, queryCount: 0, memberCount: 0 };
    }

    try {
      const [{ count: wsCount }, { count: docCount }, { count: queryCount }, { count: memberCount }] = await Promise.all([
        supabase.from('workspaces').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('workspace_members').select('*', { count: 'exact', head: true }),
      ]);

      return {
        workspaceCount: wsCount || 0,
        documentCount: docCount || 0,
        queryCount: queryCount || 0,
        memberCount: memberCount || 0,
      };
    } catch (err) {
      console.warn('Supabase live stats fetch failed:', err);
      return { workspaceCount: 0, documentCount: 0, queryCount: 0, memberCount: 0 };
    }
  },
};
