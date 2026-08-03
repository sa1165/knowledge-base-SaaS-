import { parseDocumentBuffer } from './parser';
import { chunkText } from './chunker';
import { generateEmbedding, globalVectorIndex, StoredIndexedChunk } from '../rag/hybrid-retrieval';
import { storage } from '../storage';
import { dbApi } from '../api';

export interface IngestionResult {
  documentId: string;
  filename: string;
  chunkCount: number;
  status: 'ready' | 'failed';
  errorMessage?: string;
}

export async function processDocumentIngestion(
  workspaceId: string,
  documentId: string,
  filename: string,
  data: Uint8Array | ArrayBuffer | string,
  mimeType: string
): Promise<IngestionResult> {
  try {
    // 1. Upload raw binary file directly to Supabase Storage ('documents' bucket)
    const storageKey = `workspaces/${workspaceId}/documents/${documentId}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    await storage.uploadFile(storageKey, data, mimeType);

    // 2. Parse text content
    const parsed = await parseDocumentBuffer(data, mimeType, filename);
    if (!parsed.text || parsed.text.trim().length === 0) {
      throw new Error('Extracted document text is empty.');
    }

    // 3. Chunk text into token blocks
    const chunks = chunkText(parsed.text, 400, 50);

    // 4. Generate embeddings and index chunks
    const indexedChunks: StoredIndexedChunk[] = [];
    const dbChunks: { chunkIndex: number; content: string; embedding?: number[]; pageNumber?: number }[] = [];

    for (const c of chunks) {
      const embedding = await generateEmbedding(c.content);
      indexedChunks.push({
        id: `chk-${documentId}-${c.chunkIndex}`,
        documentId,
        documentName: filename,
        workspaceId,
        content: c.content,
        embedding,
        pageNumber: c.pageNumber
      });
      dbChunks.push({
        chunkIndex: c.chunkIndex,
        content: c.content,
        embedding,
        pageNumber: c.pageNumber
      });
    }

    // Hydrate in-memory index for immediate local retrieval
    globalVectorIndex.addChunks(indexedChunks);

    // Persist chunks permanently to Supabase 'document_chunks' table
    await dbApi.saveDocumentChunks(workspaceId, documentId, dbChunks);

    return {
      documentId,
      filename,
      chunkCount: chunks.length,
      status: 'ready'
    };
  } catch (err: any) {
    console.error(`Ingestion failure for ${filename}:`, err);
    return {
      documentId,
      filename,
      chunkCount: 0,
      status: 'failed',
      errorMessage: err?.message || 'Unknown processing error'
    };
  }
}
