/**
 * Multi-provider LLM client.
 * Supports: Gemini (native), Groq, OpenRouter (OpenAI-compatible).
 */

const PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    placeholder: "AIzaSy...",
    note: "Free, 15 RPM, best quality",
  },
  groq: {
    name: "Groq",
    keyUrl: "https://console.groq.com/keys",
    placeholder: "gsk_...",
    note: "Free, 30 RPM, fast",
  },
  openrouter: {
    name: "OpenRouter",
    keyUrl: "https://openrouter.ai/keys",
    placeholder: "sk-or-...",
    note: "Free models available",
  },
};

export const PROVIDER_LIST = Object.entries(PROVIDERS).map(([id, p]) => ({ id, ...p }));

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── PROVIDER-SPECIFIC CALLERS ──

async function callGeminiAPI(apiKey, prompt, images = []) {
  const parts = [{ text: prompt }];
  for (const img of images) parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

async function callGroqAPI(apiKey, prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt + "\n\nRespond with ONLY valid JSON, no markdown." }],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });
  if (!res.ok) throw { status: res.status, body: (await res.text()).slice(0, 200) };
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callOpenRouterAPI(apiKey, prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://eclipse-theory.vercel.app",
      "X-Title": "Eclipse Theory",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [{ role: "user", content: prompt + "\n\nRespond with ONLY valid JSON, no markdown." }],
      temperature: 0.7,
      max_tokens: 16384,
    }),
  });
  if (!res.ok) throw { status: res.status, body: (await res.text()).slice(0, 200) };
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// ── UNIFIED CALLER ──

async function callProvider(providerId, apiKey, prompt, images = []) {
  switch (providerId) {
    case "gemini": return callGeminiAPI(apiKey, prompt, images);
    case "groq": return callGroqAPI(apiKey, prompt);
    case "openrouter": return callOpenRouterAPI(apiKey, prompt);
    default: throw new Error(`Unknown provider: ${providerId}`);
  }
}

/**
 * Call LLM with a specific key entry {providerId, key}.
 * Parses JSON response. Returns null on failure.
 */
export async function callGemini(keyEntry, prompt, images = [], retries = 2) {
  const { providerId, key } = typeof keyEntry === "string"
    ? { providerId: "gemini", key: keyEntry }
    : keyEntry;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const rawText = await callProvider(providerId, key, prompt, images);
      if (!rawText) return null;
      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      const status = err?.status || 0;
      if (status === 429) {
        console.warn(`[${providerId}] 429, waiting ${3 + attempt * 3}s`);
        await sleep(3000 + attempt * 3000);
        continue;
      }
      console.error(`[${providerId}] Attempt ${attempt + 1}:`, err.body || err.message || err);
      if (attempt === retries) return null;
      await sleep(1500 * (attempt + 1));
    }
  }
  return null;
}

// ── PROMPTS (unchanged) ──

export function buildTopicPrompt(topicName, moduleName, courseName, depth, referenceText = "") {
  const wordRange = depth === "brief" ? "200-350" : "400-700";
  const ctx = referenceText
    ? `\n\nSTUDENT NOTES (use as primary source):\n${referenceText}\n`
    : "";

  return `Expert educator creating study notes for "${topicName}" in "${moduleName}", course "${courseName}".${ctx}

Return ONLY valid JSON:
{"difficulty":"Easy/Medium/Hard","estimatedMinutes":number,"introduction":"80-120 words","coreConcept":"${wordRange} words","steps":["s1","s2","s3","s4"],"types":[{"type":"n","description":"d","useCase":"u"}],"properties":[{"name":"n","explanation":"e"}],"diagram":"ASCII diagram","realWorldAnalogy":"60-100 words","codeLanguage":"python or text","codeExample":"working example","codeInput":"input","codeProcess":"process","codeOutput":"output","keyPoints":["p1","p2","p3","p4","p5"],"interviewQuestions":[{"question":"q?","answer":"detailed answer"}],"commonMistakes":[{"mistake":"m","correction":"c"}],"edgeCases":["e1","e2"],"advantages":["a1","a2","a3"],"disadvantages":["d1","d2","d3"],"relatedTopics":[{"topic":"t","relationship":"r"}],"summary":"one sentence"}`;
}

export function buildModulePrompt(moduleName, topics, courseName, referenceText = "") {
  const ctx = referenceText ? `\nNotes:\n${referenceText.slice(0, 3000)}\n` : "";
  return `Module metadata for "${moduleName}" in "${courseName}".
Topics: ${topics.join(", ")}${ctx}
Return ONLY valid JSON:
{"overview":"2-3 sentences","objectives":["o1","o2","o3"],"estimatedHours":number,"difficulty":"Easy/Medium/Hard","prerequisites":"or None"}`;
}

export function buildGlossaryPrompt(courseName, allTopics) {
  return `Glossary of 8-15 terms for "${courseName}": ${allTopics.join(", ")}.
Return ONLY valid JSON:
{"terms":[{"term":"name","definition":"definition","firstSeen":"Module X, Topic Y"}]}`;
}

export function buildRoutePrompt(modules, extractedText) {
  const list = modules.map((m, i) => `${i}: "${m.name}" (${m.topics.join(", ")})`).join("\n");
  return `Assign notes to modules.\nMODULES:\n${list}\nNOTES:\n${extractedText.slice(0, 15000)}\nReturn ONLY valid JSON: {"mapping":[{"moduleIndex":0,"relevantContent":"relevant text"}]}
Include entry for EVERY module. Copy text verbatim.`;
}
