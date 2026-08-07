export interface Chunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageNumber?: number;
  sectionHeading?: string;
}

/**
 * Page-Aware Document Chunker
 * Detects `--- Page X ---` boundaries, maintains accurate page tracking per chunk,
 * and strips page markers out of text content.
 */
export function chunkText(
  text: string,
  targetChunkSize = 350,
  overlapSize = 40
): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  // Normalize line breaks
  const normalizedText = text.replace(/\r\n/g, '\n');
  const lines = normalizedText.split('\n');

  const chunks: Chunk[] = [];
  let currentChunkWords: string[] = [];
  let chunkIndex = 0;
  let currentPage = 1;
  let currentHeading: string | undefined = undefined;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Detect Page Marker: `--- Page X ---`
    const pageMatch = trimmedLine.match(/^---\s*Page\s+(\d+)\s*---$/i);
    if (pageMatch) {
      currentPage = parseInt(pageMatch[1], 10);
      continue; // Don't add page marker line itself into chunk text
    }

    // Detect Section Heading
    const headingMatch = trimmedLine.match(/^#+\s+(.+)$/) || trimmedLine.match(/^([A-Z0-9\s.:-]{4,50})$/);
    if (headingMatch && !trimmedLine.includes('---')) {
      currentHeading = headingMatch[1].trim();
    }

    const words = trimmedLine.split(/\s+/).filter(Boolean);

    if (currentChunkWords.length + words.length <= targetChunkSize) {
      currentChunkWords.push(...words);
    } else {
      // Flush current chunk
      if (currentChunkWords.length > 0) {
        const content = currentChunkWords.join(' ');
        chunks.push({
          chunkIndex: chunkIndex++,
          content,
          tokenCount: Math.ceil(currentChunkWords.length * 1.3),
          pageNumber: currentPage,
          sectionHeading: currentHeading
        });
      }

      // Keep overlap from previous chunk
      const overlapWords = currentChunkWords.slice(-overlapSize);
      currentChunkWords = [...overlapWords, ...words];
    }
  }

  // Flush remaining words
  if (currentChunkWords.length > 0) {
    const content = currentChunkWords.join(' ');
    chunks.push({
      chunkIndex: chunkIndex++,
      content,
      tokenCount: Math.ceil(currentChunkWords.length * 1.3),
      pageNumber: currentPage,
      sectionHeading: currentHeading
    });
  }

  return chunks;
}
