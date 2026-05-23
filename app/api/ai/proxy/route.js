import { NextResponse } from "next/server";
import { verifyAuth } from "../../../lib/auth-server";

// ── PROVIDER CALLERS (Server-side implementation to avoid client-side API key leak) ──

async function callGeminiAPI(apiKey, prompt, images = []) {
  const parts = [{ text: prompt }];
  for (const img of images) {
    parts.push({ 
      inline_data: { 
        mime_type: img.mimeType || img.mime_type, 
        data: img.data 
      } 
    });
  }

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
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  if (data.candidates?.[0]?.finishReason === "SAFETY") return null;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

async function callGroqAPI(apiKey, prompt, systemPrompt = null) {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ 
    role: "user", 
    content: prompt + "\n\nRespond with ONLY valid JSON, no markdown code blocks." 
  });
  
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${apiKey}` 
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages,
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

async function callOpenRouterAPI(apiKey, prompt, model = "meta-llama/llama-3.3-70b-instruct", systemPrompt = null) {
  const messages = [];
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
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://eclipse-theory.vercel.app",
      "X-Title": "Eclipse Theory",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 16384,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

export async function POST(request) {
  // 1. Authenticate user
  const authUser = await verifyAuth(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { providerId, prompt, images, options = {} } = await request.json();

    if (!providerId || !prompt) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 2. Select system key based on providerId
    let apiKey = "";
    if (providerId === "gemini") {
      apiKey = process.env.GEMINI_API_KEY;
    } else if (providerId === "groq") {
      apiKey = process.env.GROQ_API_KEY;
    } else if (providerId === "openrouter") {
      apiKey = process.env.OPENROUTER_API_KEY;
    }

    // Fallbacks if one is not configured but another is
    if (!apiKey) {
      apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
    }

    if (!apiKey) {
      return NextResponse.json({ error: "No system API key configured for this provider" }, { status: 500 });
    }

    // 3. Make LLM call
    let result = "";
    if (providerId === "gemini") {
      result = await callGeminiAPI(apiKey, prompt, images);
    } else if (providerId === "groq") {
      result = await callGroqAPI(apiKey, prompt, options.systemPrompt);
    } else if (providerId === "openrouter") {
      result = await callOpenRouterAPI(apiKey, prompt, options.model, options.systemPrompt);
    } else {
      return NextResponse.json({ error: `Unsupported provider: ${providerId}` }, { status: 400 });
    }

    return NextResponse.json({ result });

  } catch (error) {
    console.error("AI Proxy Error:", error);
    return NextResponse.json({ error: error.message || "Failed to contact LLM provider" }, { status: 500 });
  }
}
