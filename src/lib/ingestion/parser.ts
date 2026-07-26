import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ParsedDocument {
  text: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

export async function parseDocumentBuffer(
  data: Uint8Array | ArrayBuffer | string,
  mimeType: string,
  filename: string
): Promise<ParsedDocument> {
  const extension = filename.split('.').pop()?.toLowerCase();

  // If string, return text directly
  if (typeof data === 'string') {
    return { text: data };
  }

  const buffer = typeof Buffer !== 'undefined' && Buffer.from ? Buffer.from(data as any) : new Uint8Array(data as any);

  if (mimeType.includes('pdf') || extension === 'pdf') {
    try {
      const parsedData = await pdfParse(buffer as any);
      return {
        text: parsedData.text,
        pageCount: parsedData.numpages,
        metadata: { info: parsedData.info }
      };
    } catch (err: any) {
      console.warn('PDF parsing fallback applied:', err?.message);
      const textDecoder = new TextDecoder('utf-8');
      return { text: textDecoder.decode(buffer) };
    }
  }

  if (mimeType.includes('wordprocessingml') || extension === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer: buffer as any });
      return {
        text: result.value,
        metadata: { warnings: result.messages }
      };
    } catch (err: any) {
      console.warn('DOCX parsing fallback applied:', err?.message);
      const textDecoder = new TextDecoder('utf-8');
      return { text: textDecoder.decode(buffer) };
    }
  }

  // Plain Text / Markdown / Code Fallback
  const textDecoder = new TextDecoder('utf-8');
  return {
    text: textDecoder.decode(buffer)
  };
}
