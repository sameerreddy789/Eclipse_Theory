export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function renderTopicMarkdown(tNum, topicName, d) {
  let s = "";
  let sectionNum = 1;

  s += `## 🔹 Topic ${tNum}: ${topicName}\n\n`;
  s += `> **Difficulty:** ${d.difficulty || "Medium"}\n`;
  s += `> **Estimated Time:** ${d.estimatedMinutes || 30} min\n`;
  s += `> **Revision Status:** 🔲 Not Started\n\n`;
  s += `---\n\n`;

  // Section 1: Detailed Explanation (always shown)
  s += `### 📖 ${sectionNum}. Detailed Explanation\n\n`;

  // 1.1 Core Concept (always shown)
  s += `#### ${sectionNum}.1 Core Concept\n\n${d.coreConcept || ""}\n\n`;

  // 1.2 How It Works (always shown)
  s += `#### ${sectionNum}.2 How It Works (Step-by-Step)\n\n`;
  (d.steps || []).forEach((step, i) => { s += `${i + 1}. ${step}\n`; });
  s += `\n`;

  // 1.3 Types / Variations (only if types exist)
  let subSection = 3;
  if (d.types && d.types.length > 0) {
    s += `#### ${sectionNum}.${subSection} Types / Variations\n\n`;
    s += `| Type | Description | Use Case |\n|------|-------------|----------|\n`;
    d.types.forEach((t) => { s += `| ${t.type} | ${t.description} | ${t.useCase} |\n`; });
    s += `\n`;
    subSection++;
  }

  // 1.4 Properties / Characteristics (only if properties exist)
  if (d.properties && d.properties.length > 0) {
    s += `#### ${sectionNum}.${subSection} Properties / Characteristics\n\n`;
    d.properties.forEach((p) => { s += `- **${p.name}:** ${p.explanation}\n`; });
    s += `\n`;
  }

  s += `---\n\n`;
  sectionNum++;

  // Section 2: Visual Representation (always shown)
  s += `### 🖼️ ${sectionNum}. Visual Representation\n\n`;
  s += `**Diagram: ${topicName}**\n\n`;
  
  // Detect Mermaid syntax with fixed operator precedence
  const diagramText = (d.diagram || "").trim();
  const isMermaid = diagramText && (
    diagramText.startsWith('graph') ||
    diagramText.startsWith('flowchart') ||
    diagramText.startsWith('sequenceDiagram') ||
    diagramText.startsWith('classDiagram') ||
    diagramText.startsWith('stateDiagram') ||
    diagramText.startsWith('erDiagram') ||
    diagramText.startsWith('gantt') ||
    diagramText.startsWith('pie') ||
    diagramText.startsWith('mindmap')
  );
  
  if (isMermaid) {
    s += `\`\`\`mermaid\n${diagramText}\n\`\`\`\n\n`;
  } else if (diagramText && diagramText !== "No diagram available" && diagramText !== "Diagram not available") {
    s += `\`\`\`\n${diagramText}\n\`\`\`\n\n`;
  }
  
  s += `---\n\n`;
  sectionNum++;

  // Section 3: Practical Application
  const hasCodeExample = d.codeExample && d.codeExample !== "// No code example" && d.codeExample !== "// Content not available" && d.codeExample.trim() !== "";
  const hasExecTrace = (d.codeInput && d.codeInput.trim() && d.codeInput.trim() !== "None") || 
                       (d.codeProcess && d.codeProcess.trim() && d.codeProcess.trim() !== "None") || 
                       (d.codeOutput && d.codeOutput.trim() && d.codeOutput.trim() !== "None");
  const hasAnalogy = d.realWorldAnalogy && d.realWorldAnalogy.trim() !== "" && d.realWorldAnalogy !== "Content generation failed. Please regenerate this topic.";

  if (hasAnalogy || hasCodeExample) {
    s += `### 💡 ${sectionNum}. Practical Application\n\n`;
    
    if (hasAnalogy) {
      s += `#### 🔸 Real-World Analogy\n\n${d.realWorldAnalogy}\n\n`;
    }
    
    if (hasCodeExample) {
      s += `#### 🔸 Technical Example\n\n`;
      s += `\`\`\`${d.codeLanguage || ""}\n${d.codeExample}\n\`\`\`\n\n`;
      
      if (hasExecTrace) {
        s += `**Execution Trace:**\n\n\`\`\`\n`;
        if (d.codeInput && d.codeInput.trim() && d.codeInput.trim() !== "None") s += `Input:   ${d.codeInput}\n`;
        if (d.codeProcess && d.codeProcess.trim() && d.codeProcess.trim() !== "None") s += `Process: ${d.codeProcess}\n`;
        if (d.codeOutput && d.codeOutput.trim() && d.codeOutput.trim() !== "None") s += `Output:  ${d.codeOutput}\n`;
        s += `\`\`\`\n\n`;
      }
    }
    
    s += `---\n\n`;
    sectionNum++;
  }

  // Section: Key Highlights (always shown if keyPoints exist)
  if (d.keyPoints && d.keyPoints.length > 0) {
    s += `### 🔑 ${sectionNum}. Key Highlights\n\n`;
    s += `| # | Point |\n|---|-------|\n`;
    d.keyPoints.forEach((p, i) => { s += `| ${i + 1} | ${p} |\n`; });
    s += `\n---\n\n`;
    sectionNum++;
  }

  // Section: Probable Questions & Solutions (renamed from Interview Insights)
  if ((d.probableQuestions && d.probableQuestions.length > 0) || 
      (d.interviewQuestions && d.interviewQuestions.length > 0) ||
      (d.commonMistakes && d.commonMistakes.length > 0)) {
    s += `### 🎯 ${sectionNum}. Probable Questions & Solutions\n\n`;
    
    // Support both old (interviewQuestions) and new (probableQuestions) schema
    const questions = d.probableQuestions || d.interviewQuestions || [];
    if (questions.length > 0) {
      questions.forEach((q, i) => {
        const answer = q.solution || q.answer || "";
        s += `${i + 1}. **${q.question}**\n   > **Solution:** ${answer}\n\n`;
      });
    }
    
    if (d.commonMistakes && d.commonMistakes.length > 0) {
      s += `**Common Mistakes:**\n\n`;
      d.commonMistakes.forEach((m) => {
        s += `- ❌ ${m.mistake}\n  - ✅ Correct: ${m.correction}\n\n`;
      });
    }
    
    if (d.edgeCases && d.edgeCases.length > 0) {
      s += `**Edge Cases:**\n\n`;
      d.edgeCases.forEach((e) => { s += `- ${e}\n`; });
      s += `\n`;
    }
    
    s += `---\n\n`;
    sectionNum++;
  }

  // Section: Advantages (only if array has entries)
  if (d.advantages && d.advantages.length > 0) {
    s += `### ✅ ${sectionNum}. Advantages\n\n`;
    d.advantages.forEach((a, i) => { s += `${i + 1}. ${a}\n`; });
    s += `\n`;
    sectionNum++;
  }

  // Section: Disadvantages (only if array has entries)
  if (d.disadvantages && d.disadvantages.length > 0) {
    s += `### ❌ ${sectionNum}. Disadvantages\n\n`;
    d.disadvantages.forEach((a, i) => { s += `${i + 1}. ${a}\n`; });
    s += `\n---\n\n`;
    sectionNum++;
  } else if (d.advantages && d.advantages.length > 0) {
    // Add separator after advantages if no disadvantages
    s += `---\n\n`;
  }

  // Section: One-Line Summary (always shown)
  s += `### 📝 ${sectionNum}. One-Line Summary\n\n> ${d.summary || ""}\n\n---\n\n`;

  return s;
}

export function assembleMarkdown({ courseName, depth, modules, moduleMetas, topicDataMap, glossaryData }) {
  const now = new Date().toISOString().split("T")[0];
  const totalTopics = modules.reduce((s, m) => s + m.topics.length, 0);
  let md = "";

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
    md += `> **Difficulty:** ${meta.difficulty || "Medium"}\n\n`;
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
    md += `| Concept | Key Rule / Formula | Example |\n|---------|--------------------|----------|\n`;
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
