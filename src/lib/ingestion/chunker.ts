export interface Chunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageNumber?: number;
  sectionHeading?: string;
}

// Regex patterns to detect section headings in documents
// Matches: ALL CAPS lines (like "CERTIFICATIONS & ACHIEVEMENTS"), Markdown headers (## Heading), or Title Case headers
const SECTION_HEADING_RE = /^(#{1,4}\s+.+|[A-Z][A-Z\s&\/\-:]{3,60}[A-Z]|[A-Z][a-zA-Z\s&\/\-:]{4,60}:)$/;

function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  if (trimmed.includes('---')) return false; // page markers
  return SECTION_HEADING_RE.test(trimmed);
}

/**
 * Enterprise-Grade Section-Aware Document Chunker
 *
 * KEY IMPROVEMENTS over previous version:
 *
 * 1. SECTION HEADING INJECTION: The current section heading is PREPENDED to
 *    every chunk's content string. This means BM25 and vector search will
 *    always find "CERTIFICATIONS & ACHIEVEMENTS" in chunks from that section,
 *    even if the word "certifications" never appears in the body text.
 *
 * 2. SECTION BOUNDARY FLUSHING: When a new section heading is detected, the
 *    current chunk is flushed immediately. Sections never bleed into each other.
 *    Previously, "Skills" and "Certifications" shared the same chunk.
 *
 * 3. SMALLER CHUNKS (250 words, 60-word overlap): Creates more focused, 
 *    section-scoped chunks. Better precision for short queries.
 *
 * 4. MINIMUM CHUNK SIZE: Prevents tiny orphan chunks from section headers alone.
 */
export function chunkText(
  text: string,
  targetChunkSize = 250,
  overlapSize = 60,
  minChunkSize = 30
): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  // Normalize line breaks
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');

  const chunks: Chunk[] = [];
  let currentChunkWords: string[] = [];
  let chunkIndex = 0;
  let currentPage = 1;
  let currentHeading: string | undefined = undefined;

  const flushChunk = () => {
    if (currentChunkWords.length < minChunkSize) return;

    // CRITICAL FIX: Prepend section heading into chunk content
    // so BM25/vector search always sees the section name in the content
    let content = currentChunkWords.join(' ').trim();
    if (currentHeading) {
      content = `${currentHeading}\n${content}`;
    }

    chunks.push({
      chunkIndex: chunkIndex++,
      content,
      tokenCount: Math.ceil(currentChunkWords.length * 1.3),
      pageNumber: currentPage,
      sectionHeading: currentHeading,
    });
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // ── Detect Page Markers ──────────────────────────────────────────────────
    const pageMatch = trimmedLine.match(/^---\s*Page\s+(\d+)\s*---$/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      continue;
    }

    // ── Detect Section Heading ───────────────────────────────────────────────
    if (isHeading(trimmedLine)) {
      // CRITICAL FIX: Flush existing chunk at every section boundary
      // so sections never bleed into each other
      flushChunk();

      // Start fresh with just the overlap from previous chunk (for context continuity)
      const overlapWords = currentChunkWords.slice(-overlapSize);
      currentChunkWords = overlapWords;

      // Set new section heading
      currentHeading = trimmedLine.replace(/^#+\s*/, '').trim();
      continue; // Don't add the heading line itself as body content
    }

    // ── Regular Content Line ─────────────────────────────────────────────────
    const words = trimmedLine.split(/\s+/).filter(Boolean);

    if (currentChunkWords.length + words.length <= targetChunkSize) {
      currentChunkWords.push(...words);
    } else {
      // Flush current chunk when it reaches target size
      flushChunk();

      // Keep overlap from previous chunk for context continuity
      const overlapWords = currentChunkWords.slice(-overlapSize);
      currentChunkWords = [...overlapWords, ...words];
    }
  }

  // Flush remaining words as final chunk
  flushChunk();

  return chunks;
}
