import { NextResponse } from "next/server";

export const maxDuration = 300;

function buildTopicPrompt(topicName, moduleName, courseName, depth) {
  const wordRange = depth === "brief" ? "200-350" : "400-700";
  return `You are an expert educator. Generate comprehensive study content for the topic "${topicName}" under the module "${moduleName}" in the course "${courseName}".

Return ONLY valid JSON (no markdown fences, no extra text) with this exact structure:
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

function buildModulePrompt(moduleName, topics, courseName) {
  return `You are an expert educator. Generate module-level metadata for the module "${moduleName}" in the course "${courseName}".
Topics in this module: ${topics.join(", ")}

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "overview": "2-3 sentence overview of what this module covers and why it matters",
  "objectives": ["learning objective 1", "objective 2", "objective 3"],
  "estimatedHours": number,
  "difficulty": "Easy" or "Medium" or "Hard",
  "prerequisites": "prerequisite description or None"
}`;
}

function buildGlossaryPrompt(courseName, allTopics) {
  return `You are an expert educator. Generate a glossary of 8-15 key technical terms for the course "${courseName}" covering these topics: ${allTopics.join(", ")}.

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "terms": [{"term": "name", "definition": "clear definition", "firstSeen": "Module X, Topic Y"}]
}`;
}

async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
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
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");

  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

function renderTopicMarkdown(tNum, topicName, data) {
  const d = data;
  let s = "";

  s += `## 🔹 Topic ${tNum}: ${topicName}\n\n`;
  s += `> **Difficulty:** ${d.difficulty || "Medium"}\n`;
  s += `> **Estimated Time:** ${d.estimatedMinutes || 30} min\n`;
  s += `> **Revision Status:** 🔲 Not Started\n\n`;
  s += `---\n\n`;

  s += `### 📖 1. Detailed Explanation\n\n`;
  s += `#### 1.1 Introduction\n\n${d.introduction || ""}\n\n`;
  s += `#### 1.2 Core Concept\n\n${d.coreConcept || ""}\n\n`;

  s += `#### 1.3 How It Works (Step-by-Step)\n\n`;
  (d.steps || []).forEach((step, i) => { s += `${i + 1}. ${step}\n`; });
  s += `\n`;

  s += `#### 1.4 Types / Variations\n\n`;
  s += `| Type | Description | Use Case |\n|------|-------------|----------|\n`;
  (d.types || []).forEach((t) => { s += `| ${t.type} | ${t.description} | ${t.useCase} |\n`; });
  s += `\n`;

  s += `#### 1.5 Properties / Characteristics\n\n`;
  (d.properties || []).forEach((p) => { s += `- **${p.name}:** ${p.explanation}\n`; });
  s += `\n---\n\n`;

  s += `### 🖼️ 2. Visual Representation\n\n`;
  s += `**Diagram: ${topicName}**\n\n\`\`\`\n${d.diagram || "No diagram available"}\n\`\`\`\n\n---\n\n`;

  s += `### 💡 3. Practical Application\n\n`;
  s += `#### 🔸 Real-World Analogy\n\n${d.realWorldAnalogy || ""}\n\n`;
  s += `#### 🔸 Technical Example\n\n`;
  s += `\`\`\`${d.codeLanguage || ""}\n${d.codeExample || "// No code example"}\n\`\`\`\n\n`;
  s += `**Execution Trace:**\n\n\`\`\`\nInput:   ${d.codeInput || ""}\nProcess: ${d.codeProcess || ""}\nOutput:  ${d.codeOutput || ""}\n\`\`\`\n\n---\n\n`;

  s += `### 🔑 4. Key Highlights\n\n`;
  s += `| # | Point |\n|---|-------|\n`;
  (d.keyPoints || []).forEach((p, i) => { s += `| ${i + 1} | ${p} |\n`; });
  s += `\n---\n\n`;

  s += `### 🎯 5. Interview / Exam Insights\n\n`;
  s += `**Frequently Asked:**\n\n`;
  (d.interviewQuestions || []).forEach((q, i) => {
    s += `${i + 1}. ${q.question}\n   > **Answer:** ${q.answer}\n\n`;
  });
  s += `**Common Mistakes:**\n\n`;
  (d.commonMistakes || []).forEach((m) => {
    s += `- ❌ ${m.mistake}\n  - ✅ Correct: ${m.correction}\n\n`;
  });
  s += `**Edge Cases:**\n\n`;
  (d.edgeCases || []).forEach((e) => { s += `- ${e}\n`; });
  s += `\n---\n\n`;

  s += `### ✅ 6. Advantages\n\n`;
  (d.advantages || []).forEach((a, i) => { s += `${i + 1}. ${a}\n`; });
  s += `\n### ❌ 7. Disadvantages\n\n`;
  (d.disadvantages || []).forEach((a, i) => { s += `${i + 1}. ${a}\n`; });
  s += `\n---\n\n`;

  s += `### 🔗 8. Related Topics\n\n`;
  s += `| Topic | Relationship |\n|-------|--------------|\n`;
  (d.relatedTopics || []).forEach((r) => { s += `| ${r.topic} | ${r.relationship} |\n`; });
  s += `\n`;

  s += `### 📝 9. One-Line Summary\n\n> ${d.summary || ""}\n\n---\n\n`;

  return s;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { courseName, depth, modules, apiKey } = body;

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length < 10) {
      return NextResponse.json({ error: "Valid Gemini API key is required" }, { status: 400 });
    }
    if (!courseName || typeof courseName !== "string") {
      return NextResponse.json({ error: "courseName is required" }, { status: 400 });
    }
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return NextResponse.json({ error: "At least one module with topics is required" }, { status: 400 });
    }

    const cleanModules = modules.map((m) => ({
      name: m.name.trim(),
      topics: m.topics.filter((t) => t && t.trim()).map((t) => t.trim()),
    })).filter((m) => m.name && m.topics.length > 0);

    if (!cleanModules.length) {
      return NextResponse.json({ error: "No valid modules with topics found" }, { status: 400 });
    }

    const now = new Date().toISOString().split("T")[0];
    const totalTopics = cleanModules.reduce((s, m) => s + m.topics.length, 0);
    const allTopicNames = cleanModules.flatMap((m) => m.topics);

    // Generate all content via Gemini
    const moduleMetaPromises = cleanModules.map((m) =>
      callGemini(apiKey, buildModulePrompt(m.name, m.topics, courseName))
        .catch(() => ({ overview: "", objectives: [], estimatedHours: 0, difficulty: "Medium", prerequisites: "None" }))
    );

    const topicPromises = cleanModules.flatMap((m, mi) =>
      m.topics.map((t, ti) => ({
        mi, ti, topicName: t, moduleName: m.name,
        promise: callGemini(apiKey, buildTopicPrompt(t, m.name, courseName, depth))
          .catch(() => null),
      }))
    );

    const glossaryPromise = callGemini(apiKey, buildGlossaryPrompt(courseName, allTopicNames))
      .catch(() => ({ terms: [] }));

    const [moduleMetas, glossaryData, ...topicResults] = await Promise.all([
      Promise.all(moduleMetaPromises),
      glossaryPromise,
      ...topicPromises.map((tp) => tp.promise),
    ]);

    // Map topic results back
    const topicDataMap = {};
    topicPromises.forEach((tp, idx) => {
      const key = `${tp.mi}-${tp.ti}`;
      topicDataMap[key] = topicResults[idx];
    });

    // Build markdown
    let md = "";
    md += `# 📘 Master Learning Document\n\n`;
    md += `> **Course:** ${courseName}\n`;
    md += `> **Generated:** ${now}\n`;
    md += `> **Detail Level:** ${depth === "brief" ? "Brief" : "Detailed"}\n`;
    md += `> **Modules:** ${cleanModules.length} | **Topics:** ${totalTopics}\n\n`;
    md += `---\n\n`;

    // TOC
    md += `## 📑 Table of Contents\n\n`;
    cleanModules.forEach((m, mi) => {
      md += `- [Module ${mi + 1}: ${m.name}](#module-${mi + 1}-${slugify(m.name)})\n`;
      m.topics.forEach((t, ti) => {
        md += `  - [Topic ${mi + 1}.${ti + 1}: ${t}](#topic-${mi + 1}-${ti + 1}-${slugify(t)})\n`;
      });
    });
    md += `- [Glossary](#glossary)\n\n---\n---\n\n`;

    // Modules
    cleanModules.forEach((m, mi) => {
      const meta = moduleMetas[mi] || {};
      md += `# 🧩 Module ${mi + 1}: ${m.name}\n\n`;
      md += `> **Topics Covered:** ${m.topics.length}\n`;
      md += `> **Estimated Study Time:** ${meta.estimatedHours || "~2"} hours\n`;
      md += `> **Difficulty:** ${meta.difficulty || "Medium"}\n`;
      md += `> **Prerequisites:** ${meta.prerequisites || "None"}\n\n`;
      md += `### Module Overview\n\n${meta.overview || ""}\n\n`;
      md += `### Learning Objectives\n\n`;
      (meta.objectives || []).forEach((o) => { md += `- ${o}\n`; });
      md += `\n---\n\n`;

      m.topics.forEach((t, ti) => {
        const tData = topicDataMap[`${mi}-${ti}`];
        if (tData) {
          md += renderTopicMarkdown(`${mi + 1}.${ti + 1}`, t, tData);
        } else {
          md += `## 🔹 Topic ${mi + 1}.${ti + 1}: ${t}\n\n_Content generation failed for this topic. Please retry._\n\n---\n\n`;
        }
      });

      md += `### 📋 Module ${mi + 1} — Quick Reference\n\n`;
      md += `| Concept | Key Rule / Formula | Example |\n|---------|--------------------|---------|\n`;
      m.topics.forEach((t) => {
        const tData = topicDataMap[`${mi}-${m.topics.indexOf(t)}`];
        if (tData?.keyPoints?.[0]) {
          md += `| ${t} | ${tData.keyPoints[0]} | ${tData.codeOutput || "-"} |\n`;
        }
      });
      md += `\n---\n---\n\n`;
    });

    // Glossary
    md += `# 📚 Glossary\n\n`;
    md += `| Term | Definition | First Seen In |\n|------|-----------|---------------|\n`;
    (glossaryData?.terms || []).forEach((t) => {
      md += `| ${t.term} | ${t.definition} | ${t.firstSeen} |\n`;
    });
    md += `\n`;

    return NextResponse.json({
      markdown: md,
      meta: {
        courseName,
        modules: cleanModules.length,
        topics: totalTopics,
        depth,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err.message || "Generation failed" },
      { status: 500 }
    );
  }
}
