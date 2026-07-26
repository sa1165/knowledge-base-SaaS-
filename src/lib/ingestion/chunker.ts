export interface Chunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
  pageNumber?: number;
  sectionHeading?: string;
}

export function chunkText(
  text: string,
  targetChunkSize = 400,
  overlapSize = 50
): Chunk[] {
  if (!text || text.trim().length === 0) return [];

  // Normalize line breaks
  const normalizedText = text.replace(/\r\n/g, '\n');
  const paragraphs = normalizedText.split(/\n\s*\n/);

  const chunks: Chunk[] = [];
  let currentChunkWords: string[] = [];
  let chunkIndex = 0;
  let currentPage = 1;

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    // Check for page marker comments or headers
    const headingMatch = paragraph.match(/^#+\s+(.+)$/m);
    const sectionHeading = headingMatch ? headingMatch[1] : undefined;

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
          sectionHeading
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
      pageNumber: currentPage
    });
  }

  return chunks;
}
