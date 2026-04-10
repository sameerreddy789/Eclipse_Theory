const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function callGemini(apiKey, prompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.status === 429) {
        // Rate limited — wait and retry
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

export function buildTopicPrompt(topicName, moduleName, courseName, depth) {
  const wordRange = depth === "brief" ? "200-350" : "400-700";
  return `You are an expert educator. Generate comprehensive study content for the topic "${topicName}" under the module "${moduleName}" in the course "${courseName}".

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

export function buildModulePrompt(moduleName, topics, courseName) {
  return `You are an expert educator. Generate module-level metadata for the module "${moduleName}" in the course "${courseName}".
Topics in this module: ${topics.join(", ")}

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
