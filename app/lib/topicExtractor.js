/**
 * Topic Extraction from Text
 * Extracts course modules and topics from syllabus/outline text
 */

/**
 * Build prompt for AI-based topic extraction
 */
export function buildTopicExtractionPrompt(text) {
  return `You are a course structure analyzer. Extract modules and topics from the following text.

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
}

/**
 * Fallback: Parse text using regex patterns
 */
export function parseTextStructure(text) {
  const modules = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let currentModule = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line is a module header
    // Patterns: "Module 1:", "Chapter 1:", "Unit 1:", "Week 1:", "1. Module Name", etc.
    const modulePatterns = [
      /^(?:module|chapter|unit|week|section|part)\s*\d+\s*[:\-–—]?\s*(.+)/i,
      /^(?:module|chapter|unit|week|section|part)\s+(.+)/i,
      /^\d+\.\s*([A-Z][^.]+)$/,  // "1. Introduction"
      /^[A-Z][^a-z]*[A-Z].*$/,    // ALL CAPS or Title Case
    ];
    
    let isModule = false;
    let moduleName = null;
    
    for (const pattern of modulePatterns) {
      const match = line.match(pattern);
      if (match) {
        moduleName = match[1] || match[0];
        moduleName = moduleName.replace(/^[:\-–—\s]+/, '').trim();
        
        // Check if it looks like a module (not too long, not a sentence)
        if (moduleName.length > 5 && moduleName.length < 100 && !moduleName.endsWith('.')) {
          isModule = true;
          break;
        }
      }
    }
    
    if (isModule && moduleName) {
      // Save previous module
      if (currentModule && currentModule.topics.length > 0) {
        modules.push(currentModule);
      }
      
      // Start new module
      currentModule = {
        name: cleanText(moduleName),
        topics: []
      };
    } else {
      // Check if line is a topic
      // Patterns: "- Topic", "• Topic", "1.1 Topic", "  Topic", etc.
      const topicPatterns = [
        /^[\-–—•*]\s*(.+)/,           // Bullet points
        /^\d+\.\d+\s+(.+)/,           // Numbered (1.1, 1.2)
        /^\d+\)\s*(.+)/,              // Numbered with parenthesis
        /^[a-z]\)\s*(.+)/i,           // Lettered (a), b))
        /^\s{2,}(.+)/,                // Indented
        /^(.+)$/,                     // Plain text (last resort)
      ];
      
      for (const pattern of topicPatterns) {
        const match = line.match(pattern);
        if (match) {
          let topicName = match[1] || match[0];
          topicName = cleanText(topicName);
          
          // Valid topic: not too short, not too long, not a sentence
          if (topicName.length >= 3 && topicName.length < 150) {
            if (currentModule) {
              currentModule.topics.push(topicName);
            } else {
              // No module yet, create default one
              currentModule = {
                name: "Main Topics",
                topics: [topicName]
              };
            }
            break;
          }
        }
      }
    }
  }
  
  // Save last module
  if (currentModule && currentModule.topics.length > 0) {
    modules.push(currentModule);
  }
  
  // If no modules found, try to treat each line as a topic
  if (modules.length === 0 && lines.length > 0) {
    const topics = lines
      .map(l => cleanText(l))
      .filter(t => t.length >= 3 && t.length < 150)
      .slice(0, 20); // Max 20 topics
    
    if (topics.length > 0) {
      modules.push({
        name: "Main Topics",
        topics
      });
    }
  }
  
  return modules;
}

/**
 * Clean text: remove numbering, bullets, extra spaces
 */
function cleanText(text) {
  return text
    .replace(/^[\d\.\)\]\}\-–—•*\s]+/, '')  // Remove leading numbers, bullets
    .replace(/[:\-–—]+$/, '')                // Remove trailing colons, dashes
    .replace(/\s+/g, ' ')                    // Normalize spaces
    .trim();
}

/**
 * Validate extracted structure
 */
export function validateExtractedStructure(modules) {
  if (!Array.isArray(modules) || modules.length === 0) {
    return { valid: false, error: "No modules found" };
  }
  
  for (const module of modules) {
    if (!module.name || typeof module.name !== 'string' || module.name.length < 2) {
      return { valid: false, error: "Invalid module name" };
    }
    
    if (!Array.isArray(module.topics) || module.topics.length === 0) {
      return { valid: false, error: `Module "${module.name}" has no topics` };
    }
    
    for (const topic of module.topics) {
      if (!topic || typeof topic !== 'string' || topic.length < 2) {
        return { valid: false, error: `Invalid topic in module "${module.name}"` };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Get statistics about extracted structure
 */
export function getExtractionStats(modules) {
  const totalModules = modules.length;
  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
  const avgTopicsPerModule = totalModules > 0 ? (totalTopics / totalModules).toFixed(1) : 0;
  
  return {
    totalModules,
    totalTopics,
    avgTopicsPerModule
  };
}
