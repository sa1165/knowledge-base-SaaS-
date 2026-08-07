import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdfjs worker for browser execution
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Native Browser-Safe PDF Text Extractor using pdfjs-dist
 */
async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');

      if (pageText.trim()) {
        textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
    }

    const fullText = textParts.join('\n\n');
    if (fullText.trim().length > 0) {
      return { text: fullText, pageCount };
    }
  } catch (err: any) {
    console.warn('[Parser] pdfjs-dist extraction warning:', err?.message);
  }

  // Fallback: Stream-level text extractor (parses PDF Tj / TJ operators safely without binary headers)
  const textFromStreams = extractTextFromPdfStreams(new Uint8Array(arrayBuffer));
  return {
    text: textFromStreams || 'No extractable text found in PDF.',
    pageCount: 1,
  };
}

/**
 * Fallback PDF Text Stream Extractor (Extracts Tj/TJ text operators directly from PDF binary bytes)
 * Filters out raw binary PDF structure (%PDF-1.4, obj, catalog, etc.)
 */
function extractTextFromPdfStreams(uint8: Uint8Array): string {
  const decoder = new TextDecoder('latin1');
  const str = decoder.decode(uint8);
  const textBlocks: string[] = [];

  // Match (text) Tj operators
  const tjMatches = str.match(/\(([^()]{2,})\)\s*Tj/g) || [];
  for (const m of tjMatches) {
    const clean = m.replace(/\)\s*Tj$/, '').replace(/^\(/, '').replace(/\\([()\\])/g, '$1');
    if (clean.trim().length > 1 && /^[\x20-\x7E\s]+$/.test(clean)) {
      textBlocks.push(clean);
    }
  }

  // Match [(text)] TJ array operators
  const arrayMatches = str.match(/\[\s*(\([^\]]+\))\s*\]\s*TJ/gi) || [];
  for (const m of arrayMatches) {
    const subMatches = m.match(/\(([^()]+)\)/g) || [];
    const combined = subMatches.map(s => s.slice(1, -1).replace(/\\([()\\])/g, '$1')).join(' ');
    if (combined.trim().length > 2 && /^[\x20-\x7E\s]+$/.test(combined)) {
      textBlocks.push(combined);
    }
  }

  const result = textBlocks.join(' ').replace(/\s+/g, ' ').trim();
  return result;
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
  if (mimeType.includes('pdf') || extension === 'pdf') {
    const { text, pageCount } = await extractPdfText(arrayBuffer);
    return { text, pageCount };
  }

  // 2. DOCX Documents
  if (mimeType.includes('wordprocessingml') || extension === 'docx') {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return {
        text: result.value,
        metadata: { warnings: result.messages }
      };
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
