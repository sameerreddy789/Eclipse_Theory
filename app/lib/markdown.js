export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function renderTopicMarkdown(tNum, topicName, d) {
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
  s += `**Diagram: ${topicName}**\n\n`;
  
  // Check if diagram is Mermaid syntax
  if (d.diagram && d.diagram.trim().startsWith('graph') || d.diagram?.includes('flowchart')) {
    s += `\`\`\`mermaid\n${d.diagram}\n\`\`\`\n\n`;
  } else {
    s += `\`\`\`\n${d.diagram || "No diagram available"}\n\`\`\`\n\n`;
  }
  
  s += `---\n\n`;

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

export function assembleMarkdown({ courseName, depth, modules, moduleMetas, topicDataMap, glossaryData }) {
  const now = new Date().toISOString().split("T")[0];
  const totalTopics = modules.reduce((s, m) => s + m.topics.length, 0);
  let md = "";

  md += `# 📘 Master Learning Document\n\n`;
  md += `> **Course:** ${courseName}\n`;
  md += `> **Generated:** ${now}\n`;
  md += `> **Detail Level:** ${depth === "brief" ? "Brief" : "Detailed"}\n`;
  md += `> **Modules:** ${modules.length} | **Topics:** ${totalTopics}\n\n`;
  md += `---\n\n`;

  // TOC
  md += `## 📑 Table of Contents\n\n`;
  modules.forEach((m, mi) => {
    md += `- [Module ${mi + 1}: ${m.name}](#module-${mi + 1}-${slugify(m.name)})\n`;
    m.topics.forEach((t, ti) => {
      md += `  - [Topic ${mi + 1}.${ti + 1}: ${t}](#topic-${mi + 1}-${ti + 1}-${slugify(t)})\n`;
    });
  });
  md += `- [Glossary](#glossary)\n\n---\n---\n\n`;

  // Modules
  modules.forEach((m, mi) => {
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
    m.topics.forEach((t, ti) => {
      const tData = topicDataMap[`${mi}-${ti}`];
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

  return md;
}
