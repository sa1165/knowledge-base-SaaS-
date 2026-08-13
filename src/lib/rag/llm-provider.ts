/**
 * Dual-Engine Resilient LLM Provider
 * Groq 3-Key Failover Manager + Gemini Final Fallback
 * Engineered for < 2-second response latency, strict grounding, and zero hallucinations.
 * Production-grade: request timeouts, context length guards, stop-word filtering.
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

// ── Max characters per chunk content sent to LLM ────────────────────────────
// llama-3.3-70b has 128k token context. 6 chunks × ~1500 chars ≈ ~2000 tokens for context.
// Increased from 800 → 1500 to ensure full chunk content reaches the LLM.
const MAX_CONTENT_CHARS_PER_CHUNK = 1500;

// ── Request timeout (ms): if API doesn't respond in 15s, abort and try next key ──
const REQUEST_TIMEOUT_MS = 15000;

// ── API Key Registry (Loaded statically from environment) ───────────────────
function getGroqKeys(): string[] {
  const k1 = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GROQ_API_KEY_1) || (typeof process !== 'undefined' ? process.env?.VITE_GROQ_API_KEY_1 : '') || '';
  const k2 = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GROQ_API_KEY_2) || (typeof process !== 'undefined' ? process.env?.VITE_GROQ_API_KEY_2 : '') || '';
  const k3 = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GROQ_API_KEY_3) || (typeof process !== 'undefined' ? process.env?.VITE_GROQ_API_KEY_3 : '') || '';

  return [k1, k2, k3].filter(k => Boolean(k) && typeof k === 'string' && k.trim().length > 0);
}

function getGeminiKey(): string {
  return (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : '') || '';
}

// Round-robin index (advances after each successful request)
let currentGroqKeyIndex = 0;

// ── Fetch with Timeout ────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── System Prompt Builder ───────────────────────────────────────────────
function buildSystemPrompt(isExpertMode = false): string {
  if (isExpertMode) {
    return `You are Docly AI operating in EXPERT DEEP THINK MODE (inspired by DeepSeek R1 / Deep Think).
Your goal is to provide an EXHAUSTIVE, HIGHLY DETAILED, MASTERCLASS-LEVEL analytical explanation for the user query strictly grounded in the document context.

EXPERT DEEP THINK INSTRUCTIONS:
1. DEEP REASONING & COMPREHENSIVE COVERAGE:
   - Do NOT give brief or summarized answers.
   - Deliver a deep, comprehensive dive into the topic. Connect concepts, explain underlying mechanics, architectural principles, theoretical foundations, step-by-step breakdowns, edge cases, and practical takeaways.
2. EXHAUSTIVE STRUCTURED FORMATTING:
   - Use clear ### Headings for distinct sub-sections.
   - Use detailed multi-paragraph prose explanations for each concept.
   - Use bullet points, code blocks, or structured lists where appropriate for technical precision.
   - Use **bold** for critical terms, dates, specs, and names.
   - Use > blockquotes for key takeaways, masterclass insights, or essential notes.
3. GROUNDING & CITATIONS:
   - All facts and details MUST be grounded in the provided DOCUMENT CONTEXT.
   - Always append [Source N] inline citations after every factual claim or bullet point.
4. CONTINUITY:
   - Resolve any referential terms (pronouns like "its", "this", "that") using recent chat history.

SUGGESTED FOLLOW-UP QUESTIONS:
At the very end of your response, ALWAYS append 3 deep-dive, analytical follow-up questions formatted as:

---
**Suggested Follow-up Questions:**
- 💡 [First deep analytical follow-up question]
- 💡 [Second deep analytical follow-up question]
- 💡 [Third deep analytical follow-up question]`;
  }

  return `You are Docly AI — an expert document analyst and knowledge assistant. Your job is to read the provided document context and deliver intelligent, insightful, well-written answers — not to copy or paraphrase the document verbatim.

FUNDAMENTAL APPROACH:
- Think like an expert consultant who has read the document thoroughly and is now explaining it to a client.
- Synthesize the information. Connect ideas. Explain the "why" and "so what" behind the facts.
- Write in clear, professional, flowing prose — not raw bullet dumps copied from the document.
- Your answer should feel like it was written by a knowledgeable human analyst, not extracted by a text parser.
- NEVER hallucinate. Every claim must be grounded in the provided document context.

ACCURACY RULES:
1. All facts must come directly from the provided DOCUMENT CONTEXT.
2. Each context chunk may begin with a SECTION HEADING — use it to understand what category of information the chunk covers.
3. Scan ALL context chunks before answering. Do not stop at the first relevant sentence.
4. If the query matches a section (e.g., "certifications", "skills", "education"), extract and present EVERYTHING from that section.
5. Only if the answer genuinely does not exist in any context chunk, respond with: "Based on your uploaded documents, I could not find relevant information to answer this query."

FORMATTING RULES — follow these exactly:
- For simple factual queries ("when", "who", "what is"): give a concise, direct 1-3 sentence answer with a citation.
- For list/section queries ("certifications", "skills", "projects"): present a well-organised breakdown with ### headings and concise descriptions for each item, written in your own words.
- For analytical queries ("explain", "how does", "compare", "summarize"): write a comprehensive, structured response with ### headings, prose paragraphs, and bullet points only where lists genuinely aid clarity.
- Use **bold** for key names, numbers, dates, technologies, and titles.
- Use > blockquotes to highlight key insights or important callouts when appropriate.
- Always include [Source N] inline citations after every fact or claim.
- NEVER produce a response that looks like a direct copy-paste of the document. Always add professional framing, context, and explanation.

SUGGESTED FOLLOW-UP QUESTIONS:
At the very end of your response (unless no information was found), ALWAYS append 3 relevant, intelligent follow-up questions that probe deeper into the document context.
Format them exactly as follows at the bottom of your output:

---
**Suggested Follow-up Questions:**
- 💡 [First relevant follow-up question based on the document]
- 💡 [Second relevant follow-up question based on the document]
- 💡 [Third relevant follow-up question based on the document]`;
}

export interface HistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Contextualizes a user's follow-up query by resolving referential pronouns
 * (e.g., "its", "this", "that", "the course", "syllabus") using recent chat history.
 */
export function contextualizeQuery(latestQuery: string, history: HistoryItem[] = []): string {
  if (!history || history.length === 0) return latestQuery;

  const trimmed = latestQuery.trim();
  const lower = trimmed.toLowerCase();

  // Words or patterns indicating follow-up/referential queries
  const referentialPattern = /\b(it|its|this|that|these|those|they|them|he|she|his|her|their|the course|the unit|the subject|the document|syllabus|units|modules|chapter|more|explain|detail|list|what about|how about|tell me more)\b/i;
  const isShortQuery = trimmed.split(/\s+/).length <= 8;

  if (referentialPattern.test(lower) || isShortQuery) {
    const userMsgs = history.filter(m => m.role === 'user');
    const assistantMsgs = history.filter(m => m.role === 'assistant');

    // Get last user query topic
    const lastUserQuery = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].content.trim() : '';

    // Get last assistant main topic heading (if any)
    let lastTopicHeading = '';
    if (assistantMsgs.length > 0) {
      const lastAns = assistantMsgs[assistantMsgs.length - 1].content;
      // Extract title from assistant answer e.g. "Introduction to Machine Learning for All"
      const titleMatch = lastAns.match(/(?:^|\n)(?:#+|\*\*)\s*([^\n*#]{4,80})/);
      if (titleMatch && titleMatch[1]) {
        lastTopicHeading = titleMatch[1].trim();
      }
    }

    const contextPrefix = [lastUserQuery, lastTopicHeading].filter(Boolean).join(' ');
    if (contextPrefix) {
      return `${contextPrefix} ${latestQuery}`;
    }
  }

  return latestQuery;
}

function buildUserMessage(query: string, contexts: ContextItem[], history: HistoryItem[] = [], isExpertMode = false): string {
  let historySection = '';
  if (history.length > 0) {
    const recentHistory = history.slice(-6);
    historySection = `RECENT CONVERSATION HISTORY:\n` +
      recentHistory.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content.replace(/\n+/g, ' ').slice(0, 350)}`).join('\n') +
      `\n\n`;
  }

  if (contexts.length === 0) {
    return `${historySection}USER QUERY: ${query}\n\nDOCUMENT CONTEXT: No relevant context found in workspace documents.`;
  }

  const formattedContext = contexts.map((c, idx) => {
    // Guard: truncate content per chunk to stay within token budget
    const safeContent = c.content.length > (isExpertMode ? 2500 : MAX_CONTENT_CHARS_PER_CHUNK)
      ? c.content.slice(0, isExpertMode ? 2500 : MAX_CONTENT_CHARS_PER_CHUNK) + '...'
      : c.content;

    return `[Source ${idx + 1}] Document: "${c.documentName}"${c.pageNumber ? ` (Page ${c.pageNumber})` : ''}\nContent:\n${safeContent}`;
  }).join('\n\n---\n\n');

  const modeInstruction = isExpertMode
    ? `EXPERT DEEP THINK INSTRUCTIONS: Using the document context above and recent conversation history, write an EXHAUSTIVE, HIGHLY DETAILED, MASTERCLASS-LEVEL analytical response. Provide in-depth explanations, clear headings, multi-paragraph conceptual breakdowns, and thorough analysis for every point.`
    : `Using the document context above and the recent conversation history as your reference, write a comprehensive, intelligent, well-structured answer in your own words.
Do NOT copy the text verbatim from the document. Instead:
- Synthesize and explain the information like an expert analyst would.
- Maintain context continuity: resolve referential terms (such as "its", "this", "that") according to the recent conversation topic.
- Add professional framing, context, and insight around the facts.
- Connect related ideas where relevant.
- Include [Source N] inline citations for every fact you use.
- Format your answer for clarity and impact using headings, bold, and appropriate structure.`;

  return `${historySection}DOCUMENT CONTEXT (your knowledge base — use it to synthesize an expert answer):
${formattedContext}

USER QUERY: ${query}

${modeInstruction}`;
}

// ── Call Groq API with specific key ──────────────────────────────────────────
async function callGroqAPI(apiKey: string, query: string, contexts: ContextItem[], history: HistoryItem[] = [], isExpertMode = false): Promise<{ answer: string; model: string }> {
  const model = 'llama-3.3-70b-versatile';
  const response = await fetchWithTimeout(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: buildSystemPrompt(isExpertMode) },
          { role: 'user', content: buildUserMessage(query, contexts, history, isExpertMode) },
        ],
        temperature: isExpertMode ? 0.2 : 0.1,
        max_tokens: isExpertMode ? 3500 : 1024,
      }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim() || '';
  if (!answer) throw new Error('Groq returned empty response body');
  return { answer, model };
}

// ── Call Gemini API Fallback ──────────────────────────────────────────────────
async function callGeminiAPI(apiKey: string, query: string, contexts: ContextItem[], history: HistoryItem[] = [], isExpertMode = false): Promise<{ answer: string; model: string }> {
  const model = 'gemini-1.5-flash';
  const prompt = `${buildSystemPrompt(isExpertMode)}\n\n${buildUserMessage(query, contexts, history, isExpertMode)}`;

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: isExpertMode ? 0.2 : 0.1,
          maxOutputTokens: isExpertMode ? 3500 : 1024,
        }
      }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  if (!answer) throw new Error('Gemini returned empty response body');
  return { answer, model };
}

// ── Local Fallback Generator (When all APIs fail or offline) ─────────────────
function generateLocalGroundedAnswer(query: string, contexts: ContextItem[]): { answer: string; model: string } {
  if (contexts.length === 0) {
    return {
      answer: "Based on your uploaded documents, I could not find relevant information to answer this query. Please upload documents to your workspace and try again.",
      model: 'local-extractive-fallback'
    };
  }

  const top = contexts[0];
  const safeContent = top.content.slice(0, 600) + (top.content.length > 600 ? '...' : '');
  const formattedAnswer = [
    `**Based on your documents** — here is the most relevant passage found:\n`,
    `> "${safeContent}"\n`,
    `\n**Source:** [Source 1] ${top.documentName}${top.pageNumber ? ` (Page ${top.pageNumber})` : ''}`,
    `\n\n*Note: AI answer generation was unavailable. This is a direct extract from your document.*`,
  ].join('');

  return { answer: formattedAnswer, model: 'local-extractive-fallback' };
}

// ── Master Generate Function with 3-Key Failover ─────────────────────────────
export async function generateGroundedResponse(query: string, contexts: ContextItem[], history: HistoryItem[] = [], isExpertMode = false): Promise<LLMResponse> {
  const startTime = Date.now();
  const GROQ_KEYS = getGroqKeys();
  const GEMINI_API_KEY = getGeminiKey();

  // Early return: if no context at all, skip API call entirely
  if (contexts.length === 0) {
    const { answer, model } = generateLocalGroundedAnswer(query, []);
    return { answer, providerUsed: 'local_grounded_fallback', modelUsed: model, latencyMs: Date.now() - startTime };
  }

  // 1. Try Groq API Keys in Failover Loop
  if (GROQ_KEYS.length > 0) {
    for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
      const keyIdx = (currentGroqKeyIndex + attempt) % GROQ_KEYS.length;
      const apiKey = GROQ_KEYS[keyIdx];
      const providerLabel = `groq_key_${keyIdx + 1}` as LLMResponse['providerUsed'];

      try {
        console.log(`[RAG Engine] Attempting Groq Key ${keyIdx + 1} (Expert Mode: ${isExpertMode})...`);
        const { answer, model } = await callGroqAPI(apiKey, query, contexts, history, isExpertMode);
        currentGroqKeyIndex = (keyIdx + 1) % GROQ_KEYS.length;
        return { answer, providerUsed: providerLabel, modelUsed: model, latencyMs: Date.now() - startTime };
      } catch (err: any) {
        console.warn(`[RAG Engine] Groq Key ${keyIdx + 1} failed (${err?.message}), switching to next...`);
      }
    }
  }

  // 2. Fallback to Gemini API
  if (GEMINI_API_KEY) {
    try {
      console.log('[RAG Engine] All Groq keys exhausted → Gemini Fallback...');
      const { answer, model } = await callGeminiAPI(GEMINI_API_KEY, query, contexts, history, isExpertMode);
      return { answer, providerUsed: 'gemini_fallback', modelUsed: model, latencyMs: Date.now() - startTime };
    } catch (err: any) {
      console.warn('[RAG Engine] Gemini Fallback failed:', err?.message);
    }
  }

  // 3. Local Extractive Grounded Fallback
  console.log('[RAG Engine] → Local Extractive Fallback Engine');
  const { answer, model } = generateLocalGroundedAnswer(query, contexts);
  return { answer, providerUsed: 'local_grounded_fallback', modelUsed: model, latencyMs: Date.now() - startTime };
}
