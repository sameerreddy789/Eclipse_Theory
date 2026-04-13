/**
 * Two-stage content generation:
 * Stage 1 (Gemini): Analyze documents and extract relevant info
 * Stage 2 (OpenRouter/Groq): Write high-quality content based on extracted info
 */

import { callGemini, buildAnalysisPrompt, buildWritingPrompt, PROVIDER_LIST } from "./gemini";

/**
 * Smart provider selection based on task and availability
 */
function selectProvider(apiKeys, role, preferSpeed = false) {
  // Priority order for each role
  const priorities = {
    analyzer: preferSpeed 
      ? ["groq", "gemini"]  // Groq is faster for quick analysis
      : ["gemini", "groq"], // Gemini has larger context
    writer: preferSpeed
      ? ["groq", "openrouter", "gemini"]  // Groq is fastest
      : ["openrouter", "groq", "gemini"], // OpenRouter has best quality
  };

  const order = priorities[role] || ["gemini", "openrouter", "groq"];

  for (const providerId of order) {
    const key = apiKeys.find((k) => k.providerId === providerId);
    if (key) return key;
  }

  return null;
}

/**
 * Get API keys by role (legacy, kept for compatibility)
 */
function getKeyByRole(apiKeys, role) {
  const key = apiKeys.find((k) => {
    if (k.providerId === "gemini" && (role === "analyzer" || role === "both")) return true;
    if (k.providerId === "openrouter" && (role === "writer" || role === "both")) return true;
    if (k.providerId === "groq" && role === "both") return true;
    return false;
  });
  return key || null;
}

/**
 * Two-stage generation: Analyze with Gemini, Write with OpenRouter/Groq
 * @param {boolean} preferSpeed - If true, prioritize Groq for faster generation
 * @param {object} cachedExtractedInfo - Pre-cached analysis result (skip Stage 1)
 */
export async function generateTopicTwoStage(
  topicName,
  moduleName,
  courseName,
  depth,
  documentChunks,
  apiKeys,
  images = [],
  preferSpeed = false,
  cachedExtractedInfo = null
) {
  let extractedInfo = cachedExtractedInfo;

  // Stage 1: Analysis (skip if cached)
  if (!extractedInfo) {
    const analyzerKey = selectProvider(apiKeys, "analyzer", preferSpeed);
    if (!analyzerKey) {
      console.warn("No analyzer key found, skipping document analysis");
      return generateWithoutAnalysis(topicName, moduleName, courseName, depth, apiKeys, images, preferSpeed);
    }

    if (documentChunks && documentChunks.length > 0) {
      console.log(`[Analysis/${analyzerKey.providerId}] Analyzing ${documentChunks.length} chunks for "${topicName}"`);
      
      const analysisPrompt = buildAnalysisPrompt(topicName, moduleName, documentChunks);
      const analysisResult = await callGemini(analyzerKey, analysisPrompt, images);

      if (analysisResult?.extractedInfo) {
        extractedInfo = {
          ...analysisResult.extractedInfo,
          sources: analysisResult.sources || [],
          confidence: analysisResult.confidence || "medium",
        };
        console.log(`[Analysis] Extracted info with ${extractedInfo.confidence} confidence`);
      } else {
        console.warn(`[Analysis] Failed to extract info for "${topicName}"`);
      }
    }
  } else {
    console.log(`[Analysis/cached] Using cached analysis for "${topicName}"`);
  }

  // Stage 2: Writing (prefer OpenRouter for quality, Groq for speed)
  const writerKey = selectProvider(apiKeys, "writer", preferSpeed);
  if (!writerKey) {
    console.warn("No writer key found, falling back to analyzer for writing");
    return generateWithAnalyzer(topicName, moduleName, courseName, depth, extractedInfo, analyzerKey, images);
  }

  console.log(`[Writing/${writerKey.providerId}] Generating content for "${topicName}"`);
  
  const writingPrompt = buildWritingPrompt(topicName, moduleName, courseName, depth, extractedInfo);
  
  // Select best model based on provider
  const modelOptions = writerKey.providerId === "openrouter"
    ? { model: "meta-llama/llama-3.3-70b-instruct" } // Llama 3.3 70B - powerful and free
    : {};
  
  const content = await callGemini(
    writerKey,
    writingPrompt,
    writerKey.providerId === "groq" ? [] : images, // Groq doesn't support images
    2,
    modelOptions
  );

  if (content) {
    console.log(`[Writing] Successfully generated content for "${topicName}"`);
  } else {
    console.warn(`[Writing] Failed to generate content for "${topicName}"`);
  }

  return content;
}

/**
 * Fallback: Generate without document analysis
 */
async function generateWithoutAnalysis(topicName, moduleName, courseName, depth, apiKeys, images, preferSpeed = false) {
  const writerKey = selectProvider(apiKeys, "writer", preferSpeed) || apiKeys[0];
  if (!writerKey) return null;

  const writingPrompt = buildWritingPrompt(topicName, moduleName, courseName, depth, null);
  const modelOptions = writerKey.providerId === "openrouter"
    ? { model: "meta-llama/llama-3.3-70b-instruct" }
    : {};
  
  return callGemini(writerKey, writingPrompt, images, 2, modelOptions);
}

/**
 * Fallback: Use analyzer (Gemini) for writing too
 */
async function generateWithAnalyzer(topicName, moduleName, courseName, depth, extractedInfo, analyzerKey, images) {
  const writingPrompt = buildWritingPrompt(topicName, moduleName, courseName, depth, extractedInfo);
  return callGemini(analyzerKey, writingPrompt, images);
}

/**
 * Get statistics about API key configuration
 */
export function getKeyStats(apiKeys) {
  const hasGemini = apiKeys.some((k) => k.providerId === "gemini");
  const hasOpenRouter = apiKeys.some((k) => k.providerId === "openrouter");
  const hasGroq = apiKeys.some((k) => k.providerId === "groq");

  // Determine optimal mode
  let mode = "none";
  let quality = "none";

  if (hasGemini && hasOpenRouter) {
    mode = "two-stage-optimal";
    quality = "best";
  } else if (hasGemini && hasGroq) {
    mode = "two-stage-fast";
    quality = "good";
  } else if (hasGroq && hasOpenRouter) {
    mode = "two-stage-hybrid";
    quality = "good";
  } else if (hasGemini) {
    mode = "gemini-only";
    quality = "good";
  } else if (hasOpenRouter) {
    mode = "openrouter-only";
    quality = "good";
  } else if (hasGroq) {
    mode = "groq-only";
    quality = "fast";
  }

  return {
    hasGemini,
    hasOpenRouter,
    hasGroq,
    optimal: hasGemini && hasOpenRouter,
    mode,
    quality,
    description: getModeDescription(mode),
  };
}

function getModeDescription(mode) {
  const descriptions = {
    "two-stage-optimal": "Gemini analyzes (250K context) + Llama 3.3 70B writes (best quality)",
    "two-stage-fast": "Gemini analyzes + Groq Llama 4 Scout 17B writes (30 RPM, 30K TPM)",
    "two-stage-hybrid": "Groq analyzes (fast) + Llama 3.3 70B writes (quality)",
    "gemini-only": "Gemini for both (add OpenRouter/Groq for better writing)",
    "openrouter-only": "Llama 3.3 70B for both (add Gemini for 250K context)",
    "groq-only": "Groq Llama 4 Scout 17B for both (fastest, 30 RPM, 30K TPM)",
    "none": "No API keys configured",
  };
  return descriptions[mode] || "";
}
