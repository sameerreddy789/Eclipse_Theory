/**
 * Multi-provider LLM client.
 * Supports: Gemini (native), Groq, OpenRouter (OpenAI-compatible).
 */

const PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIzaSy...",
    note: "For document analysis (250K context, 10 RPM)",
    role: "analyzer",
    rpm: 10,
    contextWindow: 250000,
  },
  openrouter: {
    name: "OpenRouter",
    keyUrl: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
    note: "For content writing (Llama 3.3 70B, 200 RPM)",
    role: "writer",
    rpm: 200,
    contextWindow: 1000000,
  },
  groq: {
    name: "Groq",
    keyUrl: "https://console.groq.com/keys",
    placeholder: "gsk_...",
    note: "Fast processing (Llama 4 Scout 17B, 30 RPM, 30K TPM, free)",
    role: "both",
    rpm: 30,
    tpm: 30000,
    contextWindow: 128000,
  },
};

export const PROVIDER_LIST = Object.entries(PROVIDERS).map(([id, p]) => ({ id, ...p }));

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── PROVIDER-SPECIFIC CALLERS ──

async function callGeminiAPI(apiKey, prompt, images = []) {
  const parts = [{ text: prompt }];
  for (const img of images) parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw { status: res.status, body: (await res.text()).slice(0, 200) };
  const data = await res.json();
  if (data.candidates?.[0]?.finishReason === "SAFETY") return null;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function callGroqAPI(apiKey, prompt, systemPrompt = null) {
  const messages = [];
  
  // Add system prompt if provided (Llama models work better with system prompts)
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  
  messages.push({ 
    role: "user", 
    content: prompt + "\n\nRespond with ONLY valid JSON, no markdown code blocks." 
  });
  
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct", // 30K TPM, good balance
      messages,
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" }, // Force JSON output
    }),
  });
  if (!res.ok) throw { status: res.status, body: (await res.text()).slice(0, 200) };
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callOpenRouterAPI(apiKey, prompt, model = "meta-llama/llama-3.3-70b-instruct", systemPrompt = null) {
  const messages = [];
  
  // Add system prompt if provided (Llama models work better with system prompts)
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  
  messages.push({ 
    role: "user", 
    content: prompt + "\n\nRespond with ONLY valid JSON, no markdown code blocks." 
  });
  
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://eclipse-theory.vercel.app",
      "X-Title": "Eclipse Theory",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 16384,
      response_format: { type: "json_object" }, // Force JSON output
    }),
  });
  if (!res.ok) throw { status: res.status, body: (await res.text()).slice(0, 200) };
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// ── UNIFIED CALLER ──

async function callProvider(providerId, apiKey, prompt, images = [], options = {}) {
  const systemPrompt = options.systemPrompt || null;
  
  switch (providerId) {
    case "gemini": return callGeminiAPI(apiKey, prompt, images);
    case "groq": return callGroqAPI(apiKey, prompt, systemPrompt);
    case "openrouter": return callOpenRouterAPI(apiKey, prompt, options.model, systemPrompt);
    default: throw new Error(`Unknown provider: ${providerId}`);
  }
}

/**
 * Call LLM with a specific key entry {providerId, key}.
 * Parses JSON response. Returns null on failure.
 */
export async function callGemini(keyEntry, prompt, images = [], retries = 1, options = {}) {
  const { providerId, key } = typeof keyEntry === "string"
    ? { providerId: "gemini", key: keyEntry }
    : keyEntry;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const rawText = await callProvider(providerId, key, prompt, images, options);
      if (!rawText) return null;
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      const status = err?.status || 0;
      if (status === 429) {
        console.warn(`[${providerId}] 429 Rate limit, attempt ${attempt + 1}/${retries + 1}`);
        if (attempt < retries) {
          await sleep(10000); // Wait 10 seconds before retry
          continue;
        }
        return null; // Don't retry forever
      }
      console.error(`[${providerId}] Attempt ${attempt + 1}:`, err.body || err.message || err);
      if (attempt === retries) return null;
      await sleep(2000 * (attempt + 1));
    }
  }
  return null;
}

// ── PROMPTS (unchanged) ──

/**
 * ANALYSIS PROMPT - Used by Gemini to extract relevant content from documents
 */
export function buildAnalysisPrompt(topicName, moduleName, documentChunks) {
  const chunksText = documentChunks
    .map((c, i) => `[Chunk ${i + 1} - ${c.metadata.fileName}]\n${c.text}`)
    .join("\n\n---\n\n");

  return `You are a document analyzer. Your task is to extract ALL relevant information about "${topicName}" from the provided document chunks.

TOPIC: ${topicName}
MODULE: ${moduleName}

DOCUMENT CHUNKS:
${chunksText}

Your job is to:
1. Identify which chunks contain information about "${topicName}"
2. Extract key concepts, definitions, examples, code snippets, formulas
3. Preserve exact quotes, numbers, and technical details
4. Note which source file each piece of information came from

Return ONLY valid JSON:
{
  "relevantChunks": [0, 2, 5],
  "extractedInfo": {
    "definitions": ["definition 1", "definition 2"],
    "keyPoints": ["point 1", "point 2", "point 3"],
    "examples": ["example 1", "example 2"],
    "codeSnippets": ["code 1", "code 2"],
    "formulas": ["formula 1"],
    "diagrams": ["diagram description"],
    "relatedConcepts": ["concept 1", "concept 2"]
  },
  "sources": ["file1.pdf", "file2.pdf"],
  "confidence": "high/medium/low"
}`;
}

/**
 * WRITING PROMPT - Used by OpenRouter's best models to create final content
 */
export function buildWritingPrompt(topicName, moduleName, courseName, depth, extractedInfo) {
  const wordRange = depth === "brief" ? "200-350" : "400-700";
  
  const infoContext = extractedInfo ? `
EXTRACTED INFORMATION FROM STUDENT'S DOCUMENTS:

Definitions:
${extractedInfo.definitions?.map((d, i) => `${i + 1}. ${d}`).join("\n") || "None"}

Key Points:
${extractedInfo.keyPoints?.map((p, i) => `${i + 1}. ${p}`).join("\n") || "None"}

Examples:
${extractedInfo.examples?.map((e, i) => `${i + 1}. ${e}`).join("\n") || "None"}

Code Snippets:
${extractedInfo.codeSnippets?.map((c, i) => `${i + 1}. ${c}`).join("\n") || "None"}

Related Concepts:
${extractedInfo.relatedConcepts?.join(", ") || "None"}

Sources: ${extractedInfo.sources?.join(", ") || "Unknown"}

CRITICAL: Use the information above as your PRIMARY source. Build your explanation around these extracted facts, examples, and code snippets. Expand and clarify where needed, but stay true to the source material.
` : "";

  return `You are an expert educator creating comprehensive study notes for "${topicName}" in module "${moduleName}", course "${courseName}".

${infoContext}

Create a complete, well-structured learning document that:
- Uses the extracted information as the foundation
- Expands with clear explanations and context
- Includes practical examples and code
- Provides interview-ready insights
- Maintains academic rigor

Return ONLY valid JSON with this exact structure:
{
  "difficulty": "Easy/Medium/Hard",
  "estimatedMinutes": number,
  "contentSource": "${extractedInfo ? "student_documents" : "ai_knowledge"}",
  "sourcesUsed": ${extractedInfo?.sources ? JSON.stringify(extractedInfo.sources) : "[]"},
  "introduction": "80-120 words introducing the topic",
  "coreConcept": "${wordRange} words explaining the core concept in depth",
  "steps": ["step 1", "step 2", "step 3", "step 4"],
  "types": [{"type": "type name", "description": "description", "useCase": "when to use"}],
  "properties": [{"name": "property name", "explanation": "detailed explanation"}],
  "diagram": "Mermaid flowchart syntax (e.g., 'graph TD\\nA[Start]-->B[Process]\\nB-->C[End]') or ASCII diagram if Mermaid not suitable",
  "realWorldAnalogy": "60-100 words with relatable analogy",
  "codeLanguage": "python or javascript or text",
  "codeExample": "working code example with comments",
  "codeInput": "example input",
  "codeProcess": "step-by-step process",
  "codeOutput": "expected output",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "interviewQuestions": [{"question": "question?", "answer": "detailed answer"}],
  "commonMistakes": [{"mistake": "common mistake", "correction": "how to fix it"}],
  "edgeCases": ["edge case 1", "edge case 2"],
  "advantages": ["advantage 1", "advantage 2", "advantage 3"],
  "disadvantages": ["disadvantage 1", "disadvantage 2"],
  "relatedTopics": [{"topic": "related topic", "relationship": "how it relates"}],
  "summary": "one sentence summary"
}`;
}

export function buildTopicPrompt(topicName, moduleName, courseName, depth, referenceText = "", sourcesUsed = []) {
  const wordRange = depth === "brief" ? "200-350" : "400-700";
  
  let ctx = "";
  if (referenceText) {
    ctx = `\n\nRELEVANT REFERENCE MATERIAL (use as primary source):\n${referenceText}\n`;
    if (sourcesUsed.length > 0) {
      ctx += `\nSources: ${sourcesUsed.join(", ")}\n`;
    }
  }

  return `You are an expert educator creating comprehensive study notes for "${topicName}" in module "${moduleName}", course "${courseName}".

${ctx ? ctx + "\nIMPORTANT: Base your content primarily on the reference material above. Extract key concepts, examples, and explanations directly from the provided sources. If the reference material doesn't cover certain aspects, supplement with your knowledge but prioritize the uploaded content." : "Create comprehensive educational content based on your knowledge of this topic."}

Return ONLY valid JSON with this exact structure:
{
  "difficulty": "Easy/Medium/Hard",
  "estimatedMinutes": number,
  "contentSource": "${ctx ? "reference_material" : "ai_knowledge"}",
  "sourcesUsed": [${ctx ? '"list", "of", "source", "files"' : ''}],
  "introduction": "80-120 words introducing the topic",
  "coreConcept": "${wordRange} words explaining the core concept in depth",
  "steps": ["step 1", "step 2", "step 3", "step 4"],
  "types": [{"type": "type name", "description": "description", "useCase": "when to use"}],
  "properties": [{"name": "property name", "explanation": "detailed explanation"}],
  "diagram": "Mermaid flowchart syntax (e.g., 'graph TD\\nA[Start]-->B[Process]\\nB-->C[End]') or ASCII diagram if Mermaid not suitable",
  "realWorldAnalogy": "60-100 words with relatable analogy",
  "codeLanguage": "python or javascript or text",
  "codeExample": "working code example with comments",
  "codeInput": "example input",
  "codeProcess": "step-by-step process",
  "codeOutput": "expected output",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "interviewQuestions": [{"question": "question?", "answer": "detailed answer"}],
  "commonMistakes": [{"mistake": "common mistake", "correction": "how to fix it"}],
  "edgeCases": ["edge case 1", "edge case 2"],
  "advantages": ["advantage 1", "advantage 2", "advantage 3"],
  "disadvantages": ["disadvantage 1", "disadvantage 2"],
  "relatedTopics": [{"topic": "related topic", "relationship": "how it relates"}],
  "summary": "one sentence summary"
}`;
}

export function buildModulePrompt(moduleName, topics, courseName, referenceText = "") {
  const ctx = referenceText ? `\nNotes:\n${referenceText.slice(0, 3000)}\n` : "";
  return `Module metadata for "${moduleName}" in "${courseName}".
Topics: ${topics.join(", ")}${ctx}
Return ONLY valid JSON:
{"overview":"2-3 sentences","objectives":["o1","o2","o3"],"estimatedHours":number,"difficulty":"Easy/Medium/Hard","prerequisites":"or None"}`;
}

export function buildGlossaryPrompt(courseName, allTopics) {
  return `You are creating a comprehensive glossary for a course called "${courseName}".

The course covers these topics: ${allTopics.join(", ")}

Create a glossary with 10-15 key technical terms from this course. For each term:
1. Choose the most important technical terms, concepts, or jargon
2. Provide a clear, concise definition (1-2 sentences)
3. Indicate which module/topic it first appears in

Return ONLY valid JSON in this exact format:
{
  "terms": [
    {
      "term": "Term Name",
      "definition": "Clear definition of the term in 1-2 sentences.",
      "firstSeen": "Module 1, Topic: Introduction"
    }
  ]
}

Make sure to include terms that students would need to understand to master this course.`;
}

// ── API KEY TESTING ──

/**
 * Test if an API key is valid and working
 */
export async function testApiKey(providerId, apiKey) {
  const testPrompt = `Return ONLY valid JSON: {"status":"ok","message":"API key is working"}`;
  
  try {
    const result = await callProvider(providerId, apiKey, testPrompt, [], {});
    if (!result) {
      return { success: false, error: "No response from API" };
    }
    
    // Try to parse response
    const cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);
    
    if (parsed.status === "ok") {
      return { success: true, message: "API key is working!" };
    }
    
    return { success: true, message: "API responded successfully" };
  } catch (err) {
    const status = err?.status || 0;
    
    if (status === 401 || status === 403) {
      return { success: false, error: "Invalid API key" };
    } else if (status === 429) {
      return { success: false, error: "Rate limit exceeded (key is valid but temporarily blocked)" };
    } else if (status >= 500) {
      return { success: false, error: "Server error (try again later)" };
    } else {
      return { success: false, error: err.message || "Connection failed" };
    }
  }
}
