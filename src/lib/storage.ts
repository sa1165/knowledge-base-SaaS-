/**
 * Dual Storage Abstraction Layer
 * Supports Cloudflare R2 / S3 storage bucket or seamlessly falls back to local memory store
 */

export interface StorageProvider {
  uploadFile(key: string, data: Uint8Array | ArrayBuffer | string, mimeType: string): Promise<string>;
  getFile(key: string): Promise<Uint8Array | string>;
  deleteFile(key: string): Promise<void>;
}

class LocalStorageDriver implements StorageProvider {
  private fileStore = new Map<string, Uint8Array | string>();

  async uploadFile(key: string, data: Uint8Array | ArrayBuffer | string, _mimeType: string): Promise<string> {
    const stored = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    this.fileStore.set(key, stored);
    return `local://${key}`;
  }

  async getFile(key: string): Promise<Uint8Array | string> {
    const file = this.fileStore.get(key);
    if (!file) {
      throw new Error(`File not found in local storage: ${key}`);
    }
    return file;
  }

  async deleteFile(key: string): Promise<void> {
    this.fileStore.delete(key);
  }
}

export const storage = new LocalStorageDriver();
