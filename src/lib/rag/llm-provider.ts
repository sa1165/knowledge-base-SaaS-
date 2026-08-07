/**
 * Dual-Engine Resilient LLM Provider
 * Groq 3-Key Failover Manager + Gemini Final Fallback
 * Engineered for < 2-second response latency, strict grounding, and zero hallucinations.
 */

export interface LLMResponse {
  answer: string;
  providerUsed: 'groq_key_1' | 'groq_key_2' | 'groq_key_3' | 'gemini_fallback' | 'local_grounded_fallback';
  modelUsed: string;
  latencyMs: number;
}

export interface ContextItem {
  id: string;
  documentName: string;
  pageNumber?: number;
  content: string;
  score: number;
}

// Extract environment variables safely across Vite and Node
function getEnv(key: string): string {
  const metaEnv = (import.meta as any)?.env;
  if (metaEnv && metaEnv[key]) return metaEnv[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return '';
}

// ── API Key Registry (Loaded dynamically from environment) ───────────────────
function getGroqKeys(): string[] {
  const keys = [
    getEnv('VITE_GROQ_API_KEY_1'),
    getEnv('VITE_GROQ_API_KEY_2'),
    getEnv('VITE_GROQ_API_KEY_3'),
  ].filter(k => Boolean(k) && typeof k === 'string' && k.trim().length > 0);
  return keys;
}

function getGeminiKey(): string {
  return getEnv('VITE_GEMINI_API_KEY') || '';
}

// Round-robin index tracker across requests
let currentGroqKeyIndex = 0;

// ── System Prompt Builder for Strict Grounding ───────────────────────────────
function buildSystemPrompt(): string {
  return `You are Docly AI, an enterprise flagship document intelligence assistant.
Your absolute priority is accuracy, truthfulness, and zero hallucinations.

STRICT INSTRUCTIONS:
1. Answer the user's question using ONLY the provided DOCUMENT CONTEXT below.
2. Do NOT extrapolate, invent facts, or assume details not explicitly present in the context.
3. If the context does NOT contain sufficient information to answer the question, respond with:
   "Based on your uploaded documents, I could not find relevant information to answer this query."
4. Format your response cleanly using GitHub Markdown (bullet points, bold text, code blocks where appropriate).
5. Always add inline source citations like [Source 1], [Source 2] corresponding to the numbers in the context list.`;
}

function buildUserMessage(query: string, contexts: ContextItem[]): string {
  if (contexts.length === 0) {
    return `USER QUERY: ${query}\n\nDOCUMENT CONTEXT: No relevant context found in workspace documents.`;
  }

  const formattedContext = contexts.map((c, idx) => (
    `[Source ${idx + 1}] Document: "${c.documentName}"${c.pageNumber ? ` (Page ${c.pageNumber})` : ''}\nContent:\n${c.content}`
  )).join('\n\n---\n\n');

  return `DOCUMENT CONTEXT:\n${formattedContext}\n\nUSER QUERY: ${query}\n\nProvide a precise, grounded answer based strictly on the document context above.`;
}

// ── Call Groq API with specific key ──────────────────────────────────────────
async function callGroqAPI(apiKey: string, query: string, contexts: ContextItem[]): Promise<{ answer: string; model: string }> {
  const model = 'llama-3.3-70b-versatile';
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserMessage(query, contexts) },
      ],
      temperature: 0.1, // Low temperature for factual precision
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content || '';
  return { answer, model };
}

// ── Call Gemini API Fallback ──────────────────────────────────────────────────
async function callGeminiAPI(apiKey: string, query: string, contexts: ContextItem[]): Promise<{ answer: string; model: string }> {
  const model = 'gemini-1.5-flash';
  const prompt = `${buildSystemPrompt()}\n\n${buildUserMessage(query, contexts)}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { answer, model };
}

// ── Local Fallback Generator (When all APIs fail or offline) ─────────────────
function generateLocalGroundedAnswer(query: string, contexts: ContextItem[]): { answer: string; model: string } {
  if (contexts.length === 0) {
    return {
      answer: "I searched your workspace documents but couldn't find relevant information matching your query. Try uploading more documents or rephrasing your question.",
      model: 'local-extractive-fallback'
    };
  }

  const top = contexts[0];
  const formattedAnswer = `Based on **${top.documentName}**${top.pageNumber ? ` (Page ${top.pageNumber})` : ''}:\n\n> "${top.content.slice(0, 600)}${top.content.length > 600 ? '...' : ''}"\n\n*(Source: [Source 1])*`;

  return {
    answer: formattedAnswer,
    model: 'local-extractive-fallback'
  };
}

// ── Master Generate Function with 3-Key Failover ─────────────────────────────
export async function generateGroundedResponse(query: string, contexts: ContextItem[]): Promise<LLMResponse> {
  const startTime = Date.now();
  const GROQ_KEYS = getGroqKeys();
  const GEMINI_API_KEY = getGeminiKey();

  // 1. Try Groq API Keys in Failover Loop
  if (GROQ_KEYS.length > 0) {
    for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
      const keyIdx = (currentGroqKeyIndex + attempt) % GROQ_KEYS.length;
      const apiKey = GROQ_KEYS[keyIdx];
      const providerLabel = `groq_key_${keyIdx + 1}` as LLMResponse['providerUsed'];

      try {
        console.log(`[RAG Engine] Attempting Groq Key ${keyIdx + 1}...`);
        const { answer, model } = await callGroqAPI(apiKey, query, contexts);
        if (answer && answer.trim().length > 0) {
          currentGroqKeyIndex = (keyIdx + 1) % GROQ_KEYS.length; // Advance round robin
          return {
            answer,
            providerUsed: providerLabel,
            modelUsed: model,
            latencyMs: Date.now() - startTime,
          };
        }
      } catch (err: any) {
        console.warn(`[RAG Engine] Groq Key ${keyIdx + 1} failed (${err?.message}), switching to next provider...`);
      }
    }
  }

  // 2. Fallback to Gemini API
  if (GEMINI_API_KEY) {
    try {
      console.log('[RAG Engine] All Groq keys exhausted, attempting Gemini Fallback...');
      const { answer, model } = await callGeminiAPI(GEMINI_API_KEY, query, contexts);
      if (answer && answer.trim().length > 0) {
        return {
          answer,
          providerUsed: 'gemini_fallback',
          modelUsed: model,
          latencyMs: Date.now() - startTime,
        };
      }
    } catch (err: any) {
      console.warn('[RAG Engine] Gemini Fallback failed:', err?.message);
    }
  }

  // 3. Extractive Grounded Fallback
  console.log('[RAG Engine] Using Local Extractive Fallback Engine');
  const { answer, model } = generateLocalGroundedAnswer(query, contexts);
  return {
    answer,
    providerUsed: 'local_grounded_fallback',
    modelUsed: model,
    latencyMs: Date.now() - startTime,
  };
}
