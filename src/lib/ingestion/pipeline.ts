import { parseDocumentBuffer } from './parser';
import { chunkText } from './chunker';
import { generateEmbedding, globalVectorIndex, StoredIndexedChunk } from '../rag/hybrid-retrieval';
import { storage } from '../storage';
import { dbApi } from '../api';

export interface IngestionResult {
  documentId: string;
  filename: string;
  chunkCount: number;
  pageCount: number;
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
    const pageCount = parsed.pageCount || Math.max(1, Math.ceil(parsed.text.length / 2500));

    // 3. Chunk text into semantically-bounded blocks
    const chunks = chunkText(parsed.text, 250, 60);

    // 4. Generate embeddings and index chunks (batched for high-throughput 500+ page PDFs)
    const indexedChunks: StoredIndexedChunk[] = [];
    const dbChunks: { chunkIndex: number; content: string; embedding?: number[]; pageNumber?: number }[] = [];

    const BATCH_SIZE = 20;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const chunkBatch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await Promise.all(chunkBatch.map(c => generateEmbedding(c.content)));

      chunkBatch.forEach((c, idx) => {
        const embedding = embeddings[idx];
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
      pageCount,
      status: 'ready'
    };
  } catch (err: any) {
    console.error(`Ingestion failure for ${filename}:`, err);
    return {
      documentId,
      filename,
      chunkCount: 0,
      pageCount: 1,
      status: 'failed',
      errorMessage: err?.message || 'Unknown processing error'
    };
  }
}
