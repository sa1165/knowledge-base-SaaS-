import OpenAI from 'openai';

export interface RetrievalResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  pageNumber?: number;
  score: number;
  vectorRank?: number;
  bm25Rank?: number;
  rerankScore?: number;
}

export interface StoredIndexedChunk {
  id: string;
  documentId: string;
  documentName: string;
  workspaceId: string;
  content: string;
  embedding: number[];
  pageNumber?: number;
}

// ── In-memory Vector + BM25 store ────────────────────────────────────────────
class InStoreVectorIndex {
  private indexedChunks: StoredIndexedChunk[] = [];

  addChunks(chunks: StoredIndexedChunk[]) {
    // Deduplicate: skip chunks whose id is already indexed
    const existingIds = new Set(this.indexedChunks.map(c => c.id));
    const newChunks = chunks.filter(c => !existingIds.has(c.id));
    this.indexedChunks.push(...newChunks);
  }

  removeDocumentChunks(documentId: string) {
    this.indexedChunks = this.indexedChunks.filter(c => c.documentId !== documentId);
  }

  getWorkspaceChunks(workspaceId: string): StoredIndexedChunk[] {
    return this.indexedChunks.filter(c => c.workspaceId === workspaceId);
  }

  clearWorkspace(workspaceId: string) {
    this.indexedChunks = this.indexedChunks.filter(c => c.workspaceId !== workspaceId);
  }
}

export const globalVectorIndex = new InStoreVectorIndex();

// ── Stop words to exclude from BM25 token matching ───────────────────────────
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
  'may', 'might', 'must', 'can', 'could', 'to', 'of', 'in', 'on', 'at', 'by',
  'for', 'with', 'about', 'as', 'into', 'through', 'from', 'that', 'this',
  'these', 'those', 'it', 'its', 'and', 'or', 'but', 'not', 'so', 'if',
  'up', 'out', 'then', 'than', 'also', 'just', 'any', 'all', 'both', 'each',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

// ── Embedding generation ──────────────────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  // Try OpenAI embedding if configured
  const openAiKey = (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY)
    || (import.meta as any)?.env?.VITE_OPENAI_API_KEY;
  if (openAiKey && openAiKey.startsWith('sk-')) {
    try {
      const openai = new OpenAI({ apiKey: openAiKey, dangerouslyAllowBrowser: true });
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000),
      });
      return response.data[0].embedding;
    } catch (err: any) {
      console.warn('[Embedding] OpenAI error, using TF-IDF pseudo-embedding:', err?.message);
    }
  }

  // TF-IDF weighted pseudo-embedding: better than raw hash for cosine similarity
  return generateTFIDFEmbedding(text);
}

/**
 * TF-IDF weighted pseudo-embedding (1536-dim)
 * Better than raw hash: accounts for term frequency weighting
 */
function generateTFIDFEmbedding(text: string): number[] {
  const embedding = new Float64Array(1536);
  const tokens = tokenize(text);
  if (tokens.length === 0) return Array.from(embedding);

  // Calculate term frequencies
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  // Weight each term and scatter into embedding space using multiple hash positions
  for (const [token, freq] of tf.entries()) {
    const tfWeight = freq / tokens.length; // normalized TF
    // Use 3 hash positions per token to reduce collision rate (simulates multi-probe hashing)
    for (let seed = 0; seed < 3; seed++) {
      const h = djb2Hash(token + seed.toString());
      const pos = Math.abs(h) % 1536;
      embedding[pos] += tfWeight * (1 + 1 / (seed + 1)); // diminishing weight per probe
    }
  }

  // L2 normalize
  let mag = 0;
  for (let i = 0; i < 1536; i++) mag += embedding[i] * embedding[i];
  mag = Math.sqrt(mag) || 1;
  return Array.from(embedding).map(v => v / mag);
}

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// ── Cosine Similarity ─────────────────────────────────────────────────────────
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── BM25 Score (with stop-word filtering) ────────────────────────────────────
function bm25Score(queryTokens: string[], docText: string, k1 = 1.5, b = 0.75, avgDocLen = 300): number {
  const docTokens = tokenize(docText);
  const docLen = docTokens.length;
  if (docLen === 0 || queryTokens.length === 0) return 0;

  let score = 0;
  const freqMap = new Map<string, number>();
  for (const t of docTokens) freqMap.set(t, (freqMap.get(t) || 0) + 1);

  for (const token of queryTokens) {
    const tf = freqMap.get(token) || 0;
    if (tf === 0) continue;
    const idf = Math.log(1 + 1 / (0.5 + tf / docLen)); // simplified IDF within single doc
    const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLen / avgDocLen)));
    score += idf * tfNorm;
  }
  return score;
}

// ── Cross-Relevance Reranker ──────────────────────────────────────────────────
function computeRerankScore(query: string, content: string, rrfScore: number): number {
  const queryWords = Array.from(new Set(tokenize(query)));
  if (queryWords.length === 0) return rrfScore;

  const contentLower = content.toLowerCase();
  let matchCount = 0;
  let phraseBonus = 0;

  for (const word of queryWords) {
    if (contentLower.includes(word)) matchCount++;
  }

  // Bonus if exact query phrase appears in content
  if (contentLower.includes(query.toLowerCase().trim())) {
    phraseBonus = 0.2;
  }

  const keywordCoverage = matchCount / queryWords.length;
  return Math.min(1.0, (rrfScore * 0.5) + (keywordCoverage * 0.35) + phraseBonus);
}

// ── Main Hybrid Search Function ───────────────────────────────────────────────
export async function performHybridSearch(
  workspaceId: string,
  query: string,
  topK = 4,
  rrfK = 60
): Promise<RetrievalResult[]> {
  const workspaceChunks = globalVectorIndex.getWorkspaceChunks(workspaceId);
  if (workspaceChunks.length === 0) return [];

  // 1. Vector Search (semantic)
  const queryEmbedding = await generateEmbedding(query);
  const vectorScored = workspaceChunks
    .map(chunk => ({ chunk, similarity: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.similarity - a.similarity);

  // 2. BM25 Search (keyword, with stop-word filtering)
  const queryTokens = tokenize(query);
  const bm25Scored = workspaceChunks
    .map(chunk => ({ chunk, score: bm25Score(queryTokens, chunk.content) }))
    .sort((a, b) => b.score - a.score);

  // 3. Reciprocal Rank Fusion (RRF)
  const rrfMap = new Map<string, { chunk: StoredIndexedChunk; score: number; vectorRank: number; bm25Rank: number }>();

  vectorScored.forEach((item, index) => {
    const rank = index + 1;
    const entry = rrfMap.get(item.chunk.id) || { chunk: item.chunk, score: 0, vectorRank: rank, bm25Rank: workspaceChunks.length };
    entry.score += 1 / (rrfK + rank);
    entry.vectorRank = rank;
    rrfMap.set(item.chunk.id, entry);
  });

  bm25Scored.forEach((item, index) => {
    const rank = index + 1;
    const entry = rrfMap.get(item.chunk.id);
    if (!entry) return; // shouldn't happen but guard it
    entry.score += 1 / (rrfK + rank);
    entry.bm25Rank = rank;
    rrfMap.set(item.chunk.id, entry);
  });

  // 4. Reranker Pass
  const candidates = Array.from(rrfMap.values())
    .map(item => ({ ...item, rerankScore: computeRerankScore(query, item.chunk.content, item.score) }))
    .sort((a, b) => b.rerankScore - a.rerankScore);

  return candidates.slice(0, topK).map(item => ({
    chunkId: item.chunk.id,
    documentId: item.chunk.documentId,
    documentName: item.chunk.documentName,
    content: item.chunk.content,
    pageNumber: item.chunk.pageNumber,
    score: item.score,
    vectorRank: item.vectorRank,
    bm25Rank: item.bm25Rank,
    rerankScore: item.rerankScore,
  }));
}
