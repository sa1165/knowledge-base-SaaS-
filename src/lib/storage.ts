/**
 * Dual Storage Abstraction Layer
 * Uploads raw files directly to Supabase Storage bucket ('documents') with fallback to local memory.
 */
import { supabase, isSupabaseConfigured } from './supabase';

export interface StorageProvider {
  uploadFile(key: string, data: Uint8Array | ArrayBuffer | Blob | string, mimeType: string): Promise<string>;
  getPublicUrl(key: string): string | null;
  deleteFile(key: string): Promise<void>;
  downloadFile(key: string): Promise<ArrayBuffer | null>;
}

class SupabaseStorageDriver implements StorageProvider {
  private bucket = 'documents';
  private localFallback = new Map<string, Uint8Array | ArrayBuffer | Blob | string>();

  async uploadFile(key: string, data: Uint8Array | ArrayBuffer | Blob | string, mimeType: string): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      try {
        const fileBody = (typeof data === 'string' || data instanceof ArrayBuffer) ? new Blob([data], { type: mimeType }) : data;
        const { data: uploadResult, error } = await supabase.storage
          .from(this.bucket)
          .upload(key, fileBody, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) throw error;
        return uploadResult.path;
      } catch (err) {
        console.warn(`[storage] Supabase upload failed for ${key}, falling back to local store:`, err);
      }
    }

    // Fallback to local memory store
    this.localFallback.set(key, data);
    return `local://${key}`;
  }

  getPublicUrl(key: string): string | null {
    if (isSupabaseConfigured && supabase) {
      const { data } = supabase.storage.from(this.bucket).getPublicUrl(key);
      return data?.publicUrl || null;
    }
    return null;
  }

  async deleteFile(key: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.storage.from(this.bucket).remove([key]);
      } catch (err) {
        console.warn(`[storage] Supabase delete failed for ${key}:`, err);
      }
    }
    this.localFallback.delete(key);
  }

  async downloadFile(key: string): Promise<ArrayBuffer | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.storage.from(this.bucket).download(key);
        if (error || !data) throw error;
        return await data.arrayBuffer();
      } catch (err) {
        console.warn(`[storage] Supabase download failed for ${key}:`, err);
      }
    }
    // Local fallback: retrieve from in-memory store
    const local = this.localFallback.get(key);
    if (local instanceof ArrayBuffer) return local;
    if (local instanceof Blob) return await local.arrayBuffer();
    return null;
  }
}

export const storage = new SupabaseStorageDriver();
