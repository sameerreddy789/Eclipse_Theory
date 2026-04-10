const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * Call Gemini with text prompt + optional image parts.
 * @param {string} apiKey
 * @param {string} prompt - text prompt
 * @param {Array<{mimeType: string, data: string}>} images - base64 image parts
 * @param {number} retries
 */
export async function callGemini(apiKey, prompt, images = [], retries = 2) {
  const parts = [{ text: prompt }];

  // Add images as inline_data parts (Gemini multimodal)
  for (const img of images) {
    parts.push({
      inline_data: {
        mime_type: img.mimeType,
        data: img.data,
      },
    });
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty Gemini response");

      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      if (attempt === retries) return null;
      await sleep(1000 * (attempt + 1));
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Build topic prompt with optional reference material context.
 */
export function buildTopicPrompt(topicName, moduleName, courseName, depth, referenceText = "") {
  const wordRange = depth === "brief" ? "200-350" : "400-700";
  const contextBlock = referenceText
    ? `\n\nIMPORTANT: The student has provided class notes and reference material below. Use this content as the PRIMARY source for generating the study material. Extract key concepts, definitions, examples, and explanations from these notes. Supplement with your knowledge only where the notes are incomplete.\n\n--- STUDENT'S REFERENCE MATERIAL ---\n${referenceText}\n--- END REFERENCE MATERIAL ---\n`
    : "";

  return `You are an expert educator. Generate comprehensive study content for the topic "${topicName}" under the module "${moduleName}" in the course "${courseName}".${contextBlock}

Return ONLY valid JSON with this exact structure:
{
  "difficulty": "Easy" or "Medium" or "Hard",
  "estimatedMinutes": number,
  "introduction": "What it is, why it exists, where it's used (80-120 words)",
  "coreConcept": "Simple then technical explanation (${wordRange} words)",
  "steps": ["step 1 description", "step 2", "step 3", "step 4"],
  "types": [{"type": "name", "description": "desc", "useCase": "use case"}],
  "properties": [{"name": "property name", "explanation": "explanation"}],
  "diagram": "ASCII or text-based diagram illustrating the concept",
  "realWorldAnalogy": "Everyday analogy (60-100 words)",
  "codeLanguage": "language name like python, javascript, etc",
  "codeExample": "working code snippet",
  "codeInput": "sample input",
  "codeProcess": "step by step process",
  "codeOutput": "expected output",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "interviewQuestions": [{"question": "q", "answer": "a"}],
  "commonMistakes": [{"mistake": "m", "correction": "c"}],
  "edgeCases": ["edge case 1", "edge case 2"],
  "advantages": ["adv 1", "adv 2", "adv 3"],
  "disadvantages": ["dis 1", "dis 2", "dis 3"],
  "relatedTopics": [{"topic": "name", "relationship": "how related"}],
  "summary": "One-line summary of the topic"
}`;
}

export function buildModulePrompt(moduleName, topics, courseName, referenceText = "") {
  const contextBlock = referenceText
    ? `\n\nReference material from student's notes:\n${referenceText.slice(0, 3000)}\n`
    : "";

  return `You are an expert educator. Generate module-level metadata for the module "${moduleName}" in the course "${courseName}".
Topics in this module: ${topics.join(", ")}${contextBlock}

Return ONLY valid JSON:
{
  "overview": "2-3 sentence overview of what this module covers and why it matters",
  "objectives": ["learning objective 1", "objective 2", "objective 3"],
  "estimatedHours": number,
  "difficulty": "Easy" or "Medium" or "Hard",
  "prerequisites": "prerequisite description or None"
}`;
}

export function buildGlossaryPrompt(courseName, allTopics) {
  return `You are an expert educator. Generate a glossary of 8-15 key technical terms for the course "${courseName}" covering these topics: ${allTopics.join(", ")}.

Return ONLY valid JSON:
{
  "terms": [{"term": "name", "definition": "clear definition", "firstSeen": "Module X, Topic Y"}]
}`;
}

/**
 * Route extracted text content to the correct modules.
 * Gemini reads the content and assigns relevant sections to each module.
 */
export function buildRoutePrompt(modules, extractedText) {
  const moduleList = modules.map((m, i) =>
    `  ${i}: "${m.name}" (topics: ${m.topics.join(", ")})`
  ).join("\n");

  return `You are a content routing assistant. Below is text extracted from a student's uploaded class notes/slides. You also have a list of modules with their topics.

Your job: read the extracted text and assign the RELEVANT portions to each module. Extract only the content that matches each module's topics.

MODULES:
${moduleList}

EXTRACTED TEXT:
${extractedText.slice(0, 15000)}

Return ONLY valid JSON:
{
  "mapping": [
    {
      "moduleIndex": 0,
      "relevantContent": "The extracted text portions relevant to this module's topics. Include definitions, explanations, examples, formulas, key points found in the notes."
    }
  ]
}

Rules:
- Include an entry for EVERY module (even if relevantContent is empty string)
- Copy relevant text verbatim where possible — don't summarize
- If content applies to multiple modules, include it in all relevant ones
- moduleIndex must match the index numbers above (0-based)`;
}
