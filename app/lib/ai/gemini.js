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
  // SaaS Upgrade: Use System keys if keyEntry is null or 'system'
  let providerId, key;
  
  if (!keyEntry || keyEntry === "system") {
    providerId = options.preferredProvider || "gemini";
    key = providerId === "gemini" ? process.env.GEMINI_API_KEY :
          providerId === "groq" ? process.env.GROQ_API_KEY :
          process.env.OPENROUTER_API_KEY;
  } else {
    ({ providerId, key } = typeof keyEntry === "string"
      ? { providerId: "gemini", key: keyEntry }
      : keyEntry);
  }
  
  if (!key) throw new Error("No API key available for " + providerId);

  for (let attempt = 0; attempt <= retries; attempt++) {
// ... rest of logic
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
  const wordRange = depth === "brief" ? "150-250" : "300-600";
  
  const infoContext = extractedInfo ? `
EXTRACTED INFORMATION FROM STUDENT'S DOCUMENTS:

Definitions:
${extractedInfo.definitions?.map((d, i) => `${i + 1}. ${d}`).join("\n") || "None found"}

Key Points:
${extractedInfo.keyPoints?.map((p, i) => `${i + 1}. ${p}`).join("\n") || "None found"}

Examples:
${extractedInfo.examples?.map((e, i) => `${i + 1}. ${e}`).join("\n") || "None found"}

Code Snippets:
${extractedInfo.codeSnippets?.map((c, i) => `${i + 1}. ${c}`).join("\n") || "None found"}

Sources: ${extractedInfo.sources?.join(", ") || "Unknown"}

CRITICAL: Use the information above as your PRIMARY source. Build your explanation around these extracted facts, examples, and code snippets. Match your content depth to how much the source material covers this topic. If the source has detailed coverage, be equally detailed. If brief, keep it concise.
` : "";

  return `You are an expert educator creating comprehensive study notes for "${topicName}" in module "${moduleName}", course "${courseName}".

${infoContext}

CRITICAL RULES:
1. Analyze the topic and ONLY include sections that are genuinely relevant to "${topicName}"
2. If this topic doesn't have types/variations (e.g., it's a single concept, not a category), return an empty array [] for "types"
3. If this topic doesn't have measurable properties/characteristics, return an empty array [] for "properties"
4. If there's no meaningful code example for this topic, set "codeExample" to null and "codeInput", "codeProcess", "codeOutput" to null
5. Core concept should be crisp and clear — every sentence must add value, no filler or repetition
6. For probable questions, provide clear step-by-step solutions, not just brief answers
7. Only include advantages/disadvantages if they genuinely apply to this topic
8. Match your explanation depth to the source material — don't pad short topics or compress detailed ones

Return ONLY valid JSON with this structure (use null or [] for sections NOT relevant to this topic):
{
  "difficulty": "Easy/Medium/Hard",
  "estimatedMinutes": number,
  "contentSource": "${extractedInfo ? "student_documents" : "ai_knowledge"}",
  "sourcesUsed": ${extractedInfo?.sources ? JSON.stringify(extractedInfo.sources) : "[]"},
  "introduction": "80-120 words introducing the topic",
  "coreConcept": "${wordRange} words — crisp, clear, no filler. Explain the core concept thoroughly",
  "steps": ["step 1", "step 2", "step 3", "step 4"],
  "types": [{"type": "type name", "description": "description", "useCase": "when to use"}],
  "properties": [{"name": "property name", "explanation": "detailed explanation"}],
  "diagram": "Mermaid flowchart syntax (e.g., 'graph TD\\nA[Start]-->B[Process]\\nB-->C[End]') — MUST be valid Mermaid syntax",
  "realWorldAnalogy": "60-100 words with relatable analogy",
  "codeLanguage": "python or javascript or c or text",
  "codeExample": "working code example with comments, or null if not applicable",
  "codeInput": "example input or null",
  "codeProcess": "step-by-step process or null",
  "codeOutput": "expected output or null",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "probableQuestions": [{"question": "likely exam/interview question?", "solution": "detailed step-by-step solution"}],
  "commonMistakes": [{"mistake": "common mistake", "correction": "how to fix it"}],
  "edgeCases": ["edge case 1", "edge case 2"],
  "advantages": ["advantage 1", "advantage 2"],
  "disadvantages": ["disadvantage 1", "disadvantage 2"],
  "summary": "one sentence summary"
}`;
}

export function buildTopicPrompt(topicName, moduleName, courseName, depth, referenceText = "", sourcesUsed = []) {
  const wordRange = depth === "brief" ? "150-250" : "300-600";
  
  let ctx = "";
  if (referenceText) {
    ctx = `\n\nRELEVANT REFERENCE MATERIAL (use as primary source):\n${referenceText}\n`;
    if (sourcesUsed.length > 0) {
      ctx += `\nSources: ${sourcesUsed.join(", ")}\n`;
    }
  }

  return `You are an expert educator creating comprehensive study notes for "${topicName}" in module "${moduleName}", course "${courseName}".

${ctx ? ctx + "\nIMPORTANT: Base your content primarily on the reference material above. Match your content depth to how much the source material covers this topic. If the source has 2+ pages on this topic, provide detailed explanation. If brief, keep it concise. Supplement with your knowledge only where needed." : "Create comprehensive educational content based on your knowledge of this topic."}

CRITICAL RULES:
1. Only include sections genuinely relevant to "${topicName}" — return [] for irrelevant sections
2. If no meaningful code example exists, set codeExample to null
3. Core concept must be crisp and clear — no filler or repetition
4. Probable questions should have detailed step-by-step solutions
5. Only include advantages/disadvantages/properties if they genuinely apply

Return ONLY valid JSON (use null or [] for sections NOT relevant to this topic):
{
  "difficulty": "Easy/Medium/Hard",
  "estimatedMinutes": number,
  "contentSource": "${ctx ? "reference_material" : "ai_knowledge"}",
  "sourcesUsed": [${ctx ? '"list", "of", "source", "files"' : ''}],
  "introduction": "80-120 words introducing the topic",
  "coreConcept": "${wordRange} words — crisp, clear, no filler",
  "steps": ["step 1", "step 2", "step 3", "step 4"],
  "types": [{"type": "type name", "description": "description", "useCase": "when to use"}],
  "properties": [{"name": "property name", "explanation": "detailed explanation"}],
  "diagram": "Valid Mermaid syntax (graph TD, flowchart, etc.)",
  "realWorldAnalogy": "60-100 words with relatable analogy",
  "codeLanguage": "python or javascript or c or text",
  "codeExample": "working code example or null",
  "codeInput": "example input or null",
  "codeProcess": "step-by-step process or null",
  "codeOutput": "expected output or null",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "probableQuestions": [{"question": "likely exam question?", "solution": "detailed step-by-step solution"}],
  "commonMistakes": [{"mistake": "common mistake", "correction": "how to fix it"}],
  "edgeCases": ["edge case 1", "edge case 2"],
  "advantages": ["advantage 1", "advantage 2"],
  "disadvantages": ["disadvantage 1", "disadvantage 2"],
  "summary": "one sentence summary"
}`;
}

export function buildModulePrompt(moduleName, topics, courseName, referenceText = "") {
  const ctx = referenceText ? `\nNotes:\n${referenceText.slice(0, 3000)}\n` : "";
  return `Module metadata for "${moduleName}" in "${courseName}".
Topics: ${topics.join(", ")}${ctx}
Return ONLY valid JSON:
{"objectives":["objective 1","objective 2","objective 3"],"estimatedHours":number,"difficulty":"Easy/Medium/Hard"}`;
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


// ── TOPIC EXTRACTION ──

/**
 * Extract modules and topics from text using AI
 */
export async function extractTopicsFromText(apiKey, text) {
  const prompt = `You are a course structure analyzer. Extract modules and topics from the following text.

The text could be:
- A course syllabus
- Table of contents
- Course outline
- List of chapters/units

TEXT TO ANALYZE:
${text}

Extract the structure and return ONLY valid JSON in this exact format:
{
  "modules": [
    {
      "name": "Module Name (without numbers or prefixes)",
      "topics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ]
}

RULES:
1. Identify main sections as modules (chapters, units, modules, weeks)
2. Extract subtopics under each module
3. Remove numbering, bullets, and formatting (e.g., "1.1 Arrays" → "Arrays")
4. Keep names concise and clear
5. If no clear module structure, create one module called "Main Topics"
6. Minimum 1 module, minimum 1 topic per module
7. Maximum 10 modules, maximum 20 topics per module

Return ONLY the JSON, no explanation.`;

  const systemPrompt = "You are an expert at analyzing course structures and extracting organized information from text.";

  try {
    const result = await callGemini(
      apiKey,
      prompt,
      [],
      2,
      { systemPrompt }
    );
    
    if (result && result.modules && Array.isArray(result.modules)) {
      return { success: true, modules: result.modules };
    }
    
    return { success: false, error: "Invalid response format" };
  } catch (err) {
    return { success: false, error: err.message || "Extraction failed" };
  }
}
