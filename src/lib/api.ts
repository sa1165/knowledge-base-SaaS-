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
  async getWorkspaces(): Promise<Workspace[]> {
    if (!isSupabaseConfigured || !supabase) return [];
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        slug: row.slug,
        role: 'owner',
        tier: row.tier || 'free',
        docCount: 0,
        memberCount: 0,
        queryCount: 0,
        updatedAt: new Date(row.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        color: row.color || '#2563eb',
      }));
    } catch (err) {
      console.warn('Supabase fetch workspaces failed, fallback to local state:', err);
      return [];
    }
  },

  async createWorkspace(name: string, description?: string, ownerId = 'u-sanjeev'): Promise<Workspace | null> {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const color = '#2563eb';

    if (!isSupabaseConfigured || !supabase) {
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
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          description: description || '',
          color,
          tier: 'free',
          owner_id: ownerId,
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
        tier: data.tier || 'free',
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
