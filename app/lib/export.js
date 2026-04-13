/**
 * Export utilities for different formats
 */

/**
 * Generate Anki-compatible CSV from topic data
 */
export function generateAnkiCSV(courseName, modules, topicDataMap) {
  let csv = "Front,Back,Tags\n";
  
  modules.forEach((m, mi) => {
    m.topics.forEach((t, ti) => {
      const data = topicDataMap[`${mi}-${ti}`];
      if (!data) return;
      
      const tags = `${courseName.replace(/\s+/g, '_')}::${m.name.replace(/\s+/g, '_')}::${t.replace(/\s+/g, '_')}`;
      
      // Key points as cards
      (data.keyPoints || []).forEach((point) => {
        const front = escapeCSV(`What is a key point about ${t}?`);
        const back = escapeCSV(point);
        csv += `${front},${back},${tags}\n`;
      });
      
      // Interview questions as cards
      (data.interviewQuestions || []).forEach((q) => {
        const front = escapeCSV(q.question);
        const back = escapeCSV(q.answer);
        csv += `${front},${back},${tags}\n`;
      });
      
      // Common mistakes as cards
      (data.commonMistakes || []).forEach((m) => {
        const front = escapeCSV(`What is a common mistake with ${t}?`);
        const back = escapeCSV(`❌ ${m.mistake}\n✅ ${m.correction}`);
        csv += `${front},${back},${tags}\n`;
      });
      
      // Definition card
      if (data.introduction) {
        const front = escapeCSV(`What is ${t}?`);
        const back = escapeCSV(data.introduction);
        csv += `${front},${back},${tags}\n`;
      }
      
      // Summary card
      if (data.summary) {
        const front = escapeCSV(`Summarize ${t} in one sentence`);
        const back = escapeCSV(data.summary);
        csv += `${front},${back},${tags}\n`;
      }
    });
  });
  
  return csv;
}

/**
 * Generate Notion-compatible markdown
 */
export function generateNotionMarkdown(courseName, modules, moduleMetas, topicDataMap, glossaryData) {
  let md = "";
  
  // Notion database properties
  md += `---\n`;
  md += `Course: ${courseName}\n`;
  md += `Type: Study Notes\n`;
  md += `Status: In Progress\n`;
  md += `---\n\n`;
  
  md += `# ${courseName}\n\n`;
  
  modules.forEach((m, mi) => {
    const meta = moduleMetas[mi] || {};
    
    md += `## ${m.name}\n\n`;
    md += `> **Difficulty:** ${meta.difficulty || "Medium"} | **Time:** ${meta.estimatedHours || "~2"}h\n\n`;
    
    m.topics.forEach((t, ti) => {
      const data = topicDataMap[`${mi}-${ti}`];
      if (!data) return;
      
      md += `### ${t}\n\n`;
      
      // Notion callout for key info
      md += `> 💡 **Quick Summary**\n`;
      md += `> ${data.summary || "No summary available"}\n\n`;
      
      // Toggle list for detailed content
      md += `<details>\n`;
      md += `<summary>📖 Detailed Notes</summary>\n\n`;
      md += `${data.coreConcept || ""}\n\n`;
      md += `</details>\n\n`;
      
      // Code block
      if (data.codeExample) {
        md += `\`\`\`${data.codeLanguage || ""}\n${data.codeExample}\n\`\`\`\n\n`;
      }
      
      // Key points as checklist
      if (data.keyPoints && data.keyPoints.length > 0) {
        md += `**Key Points:**\n`;
        data.keyPoints.forEach((p) => {
          md += `- [ ] ${p}\n`;
        });
        md += `\n`;
      }
      
      md += `---\n\n`;
    });
  });
  
  return md;
}

/**
 * Generate study checklist
 */
export function generateStudyChecklist(courseName, modules, topicDataMap) {
  let md = `# ${courseName} - Study Checklist\n\n`;
  md += `Track your progress through the course.\n\n`;
  
  modules.forEach((m, mi) => {
    md += `## ${m.name}\n\n`;
    
    m.topics.forEach((t, ti) => {
      const data = topicDataMap[`${mi}-${ti}`];
      const time = data?.estimatedMinutes || 30;
      const difficulty = data?.difficulty || "Medium";
      
      md += `- [ ] **${t}** (${time} min, ${difficulty})\n`;
      
      if (data?.keyPoints && data.keyPoints.length > 0) {
        md += `  - Key concepts: ${data.keyPoints.slice(0, 3).join(', ')}\n`;
      }
    });
    
    md += `\n`;
  });
  
  return md;
}

/**
 * Escape CSV field
 */
function escapeCSV(text) {
  if (!text) return '""';
  
  // Remove markdown formatting
  let cleaned = text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n/g, ' ')
    .trim();
  
  // Escape quotes and wrap in quotes
  cleaned = cleaned.replace(/"/g, '""');
  return `"${cleaned}"`;
}

/**
 * Download file helper
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
