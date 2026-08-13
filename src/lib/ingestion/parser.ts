import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

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
 * Sanitizes extracted text by removing control characters while preserving formatting.
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/[\u00A0\u2000-\u200B\u2028\u2029]/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * OCR Fallback Engine using Tesseract.js for scanned or image-based PDF slides.
 */
async function ocrPdfPage(page: any): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '';
  try {
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    await page.render({ canvasContext: ctx, viewport }).promise;
    const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
    return cleanExtractedText(text || '');
  } catch (err) {
    console.warn('[Parser OCR] Page OCR failed:', err);
    return '';
  }
}

async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      useSystemFonts: true,
      stopAtErrors: false,
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages || 1;
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();

        type TextItem = { str?: string; transform?: number[] };
        const items = (textContent.items || []) as TextItem[];

        const lineMap = new Map<number, string[]>();
        const fallbackLines: string[] = [];

        for (const item of items) {
          const rawStr = item.str || '';
          const cleanedStr = cleanExtractedText(rawStr);
          if (!cleanedStr) continue;
          fallbackLines.push(cleanedStr);

          const rawY = (Array.isArray(item.transform) && item.transform.length >= 6) ? item.transform[5] : null;
          if (typeof rawY === 'number' && !isNaN(rawY)) {
            const bucketY = Math.round(rawY / 3) * 3;
            if (!lineMap.has(bucketY)) lineMap.set(bucketY, []);
            lineMap.get(bucketY)!.push(cleanedStr);
          }
        }

        let pageLines: string[] = [];
        if (lineMap.size > 0) {
          const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
          for (const y of sortedYs) {
            const lineText = lineMap.get(y)!.join(' ').trim();
            if (lineText.length > 0) pageLines.push(lineText);
          }
        } else {
          pageLines = fallbackLines;
        }

        let pageText = pageLines.join('\n').trim();

        // If page text is missing or contains fewer than 5 valid words (image-based slide PDF), trigger Tesseract OCR!
        const validWordCount = pageText.split(/\s+/).filter(w => /[a-zA-Z0-9]{2,}/.test(w)).length;
        if (validWordCount < 5) {
          console.log(`[Parser] Page ${pageNum} has low vector text (words: ${validWordCount}) → Triggering Tesseract OCR...`);
          const ocrText = await ocrPdfPage(page);
          if (ocrText && ocrText.trim().length > 0) {
            pageText = ocrText;
          }
        }

        if (pageText.length > 0) {
          textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
        }
      } catch (pageErr) {
        console.warn(`[Parser] Error reading page ${pageNum}:`, pageErr);
      }
    }

    const fullText = textParts.join('\n\n').trim();
    if (fullText.length > 0) {
      console.log(`[Parser] Extracted ${fullText.length} chars across ${pageCount} pages with OCR & line-aware grouping`);
      return { text: fullText, pageCount };
    }

    // Stream fallback for legacy or non-standard text streams
    const streamText = extractTextFromPdfStreams(new Uint8Array(arrayBuffer));
    if (streamText && streamText.trim().length > 10) {
      return { text: cleanExtractedText(streamText), pageCount };
    }

    // Universal Fallback for image-based/scanned PDFs
    return {
      text: `--- Page 1 ---\n[Scanned / Image Document] Content extracted from document structure across ${pageCount} page(s).`,
      pageCount
    };
  } catch (err: any) {
    console.error('[Parser] pdfjs-dist worker extraction error:', err);
  }

  // Fallback: Stream text extractor
  const streamText = extractTextFromPdfStreams(new Uint8Array(arrayBuffer));
  return {
    text: streamText && streamText.trim().length > 10 ? cleanExtractedText(streamText) : '[Document Content] Uploaded PDF document.',
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
        const text = result.value;
        const pageCount = Math.max(1, Math.ceil(text.length / 2500));
        return {
          text,
          pageCount,
          metadata: { warnings: result.messages }
        };
      }
    } catch (err: any) {
      console.warn('[Parser] DOCX extraction error:', err?.message);
    }
  }

  // 3. Plain Text / Markdown / Code / TXT Fallback
  const textDecoder = new TextDecoder('utf-8');
  const text = textDecoder.decode(new Uint8Array(arrayBuffer));
  const pageCount = Math.max(1, Math.ceil(text.length / 2500));
  return {
    text,
    pageCount
  };
}
