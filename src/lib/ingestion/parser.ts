import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Configure local Vite-bundled worker for PDF.js (no cross-origin CORS blocks)
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Native Browser-Safe PDF Text Extractor using PDF.js + local bundled worker.
 *
 * KEY IMPROVEMENT over previous version:
 * Groups text items by y-coordinate to reconstruct proper line breaks.
 * Previously all items were joined with ' ' (space), turning:
 *   "CERTIFICATIONS & ACHIEVEMENTS\nFinalist — Layer 3.0..."
 * into:
 *   "CERTIFICATIONS & ACHIEVEMENTS Finalist — Layer 3.0..."
 * which caused the chunker's section heading detector to fail.
 */
async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // ── Group text items by their y-coordinate to reconstruct lines ──────────
      // PDF items on the same visual line share the same (or very close) y-value.
      // We bucket items within 3px of each other as the same line.

      type TextItem = { str: string; transform: number[] };
      const items = textContent.items as TextItem[];

      if (items.length === 0) continue;

      // Build a map: roundedY → [items in reading order]
      const lineMap = new Map<number, string[]>();
      for (const item of items) {
        if (!item.str || item.str.trim() === '') continue;
        // transform[5] is the y-coordinate in PDF user space
        const rawY = item.transform ? item.transform[5] : 0;
        // Round to nearest 3px bucket to merge items on the same visual line
        const bucketY = Math.round(rawY / 3) * 3;
        if (!lineMap.has(bucketY)) lineMap.set(bucketY, []);
        lineMap.get(bucketY)!.push(item.str);
      }

      // Sort buckets by descending y (PDF y=0 is bottom; higher y = higher on page)
      const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
      const pageLines: string[] = [];
      for (const y of sortedYs) {
        const lineText = lineMap.get(y)!.join(' ').trim();
        if (lineText.length > 0) {
          pageLines.push(lineText);
        }
      }

      const pageText = pageLines.join('\n');
      if (pageText.trim().length > 0) {
        textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
    }

    const fullText = textParts.join('\n\n').trim();
    if (fullText.length > 0) {
      console.log(`[Parser] Extracted ${fullText.length} chars across ${pageCount} pages with line-aware grouping`);
      return { text: fullText, pageCount };
    }
  } catch (err: any) {
    console.error('[Parser] pdfjs-dist worker extraction error:', err);
  }

  // Fallback: Stream text extractor for non-standard / legacy text streams
  const streamText = extractTextFromPdfStreams(new Uint8Array(arrayBuffer));
  return {
    text: streamText || 'No extractable text found in PDF.',
    pageCount: 1,
  };
}

/**
 * Stream Text Extractor (fallback for non-standard PDFs)
 */
function extractTextFromPdfStreams(uint8: Uint8Array): string {
  const decoder = new TextDecoder('latin1');
  const str = decoder.decode(uint8);
  const textBlocks: string[] = [];

  const matches = str.match(/\(([^()]{2,})\)/g) || [];
  for (const m of matches) {
    const raw = m.slice(1, -1).replace(/\\([()\\])/g, '$1').trim();
    if (
      raw.length > 2 &&
      !/^(PDF|Catalog|Pages|Page|Font|Encoding|Type|Parent|Kids|Root|Info|CreationDate|ModDate|Producer|Title|Author|Subject|Keywords|ProcSet|MediaBox|CropBox|Resources)$/i.test(raw) &&
      !/^[\d\s\/\<\>\-.]*$/.test(raw) &&
      /^[\x20-\x7E\s]{3,}$/.test(raw)
    ) {
      textBlocks.push(raw);
    }
  }

  return textBlocks.join(' ').replace(/\s+/g, ' ').trim();
}

export async function parseDocumentBuffer(
  data: Uint8Array | ArrayBuffer | string,
  mimeType: string,
  filename: string
): Promise<ParsedDocument> {
  const extension = filename.split('.').pop()?.toLowerCase();

  // If string input, return directly
  if (typeof data === 'string') {
    return { text: data };
  }

  const rawBuffer = data instanceof ArrayBuffer
    ? data
    : data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

  const arrayBuffer = rawBuffer as ArrayBuffer;

  // 1. PDF Documents
  if (mimeType.includes('pdf') || extension === 'pdf' || filename.toLowerCase().endsWith('.pdf')) {
    const { text, pageCount } = await extractPdfText(arrayBuffer);
    return { text, pageCount };
  }

  // 2. DOCX Documents
  if (mimeType.includes('wordprocessingml') || extension === 'docx' || filename.toLowerCase().endsWith('.docx')) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return {
          text: result.value,
          metadata: { warnings: result.messages }
        };
      }
    } catch (err: any) {
      console.warn('[Parser] DOCX extraction error:', err?.message);
    }
  }

  // 3. Plain Text / Markdown / Code / TXT Fallback
  const textDecoder = new TextDecoder('utf-8');
  return {
    text: textDecoder.decode(new Uint8Array(arrayBuffer))
  };
}
