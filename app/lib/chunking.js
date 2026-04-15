/**
 * Smart document chunking with semantic boundaries and embeddings.
 * Splits text into meaningful chunks while preserving context.
 */

import { generateEmbedding } from './embeddings';

const CHUNK_SIZE = 800; // characters per chunk
const CHUNK_OVERLAP = 150; // overlap to preserve context

/**
 * Split text into overlapping chunks with metadata
 */
export function chunkText(text, metadata = {}) {
  if (!text || text.length < CHUNK_SIZE) {
    return [{ text: text.trim(), metadata, index: 0 }];
  }

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + CHUNK_SIZE;

    // If not at the end, try to break at sentence boundary
    if (end < text.length) {
      const sentenceEnd = text.slice(start, end + 200).search(/[.!?]\s+/);
      if (sentenceEnd !== -1 && sentenceEnd > CHUNK_SIZE * 0.5) {
        end = start + sentenceEnd + 1;
      }
    }

    const chunkText = text.slice(start, end).trim();
    if (chunkText.length > 50) {
      chunks.push({
        text: chunkText,
        metadata: { ...metadata, index, startChar: start, endChar: end },
        index,
      });
      index++;
    }

    start = end - CHUNK_OVERLAP;
  }

  return chunks;
}

/**
 * Process all uploaded files into chunks with metadata
 */
export function chunkDocuments(processedFiles) {
  const MAX_TOTAL_CHUNKS = 500; // Prevent browser freeze
  const allChunks = [];

  for (const file of processedFiles) {
    const { text, fileName, fileType } = file;
    
    if (!text || text.length < 20) continue;

    // Limit text size per file to prevent too many chunks
    const maxTextLength = 50000; // ~50KB per file
    const limitedText = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + "\n\n[Content truncated for performance]"
      : text;

    const fileChunks = chunkText(limitedText, {
      fileName,
      fileType,
      fileSize: text.length,
    });

    allChunks.push(...fileChunks);
    
    // Stop if we have too many chunks
    if (allChunks.length >= MAX_TOTAL_CHUNKS) {
      console.warn(`[Chunking] Reached maximum chunk limit (${MAX_TOTAL_CHUNKS}). Stopping.`);
      break;
    }
  }

  console.log(`[Chunking] Created ${allChunks.length} chunks from ${processedFiles.length} files`);
  return allChunks.slice(0, MAX_TOTAL_CHUNKS);
}

/**
 * Generate embeddings for all chunks (with progress callback)
 * Limits to prevent browser freeze
 */
export async function generateChunkEmbeddings(chunks, onProgress = null) {
  const MAX_CHUNKS = 500; // Limit to prevent browser freeze
  
  if (chunks.length > MAX_CHUNKS) {
    console.warn(`[Embeddings] Too many chunks (${chunks.length}). Limiting to ${MAX_CHUNKS} for performance.`);
    chunks = chunks.slice(0, MAX_CHUNKS);
  }
  
  console.log(`[Embeddings] Generating embeddings for ${chunks.length} chunks...`);
  
  const chunksWithEmbeddings = [];
  const BATCH_SIZE = 10; // Process in small batches
  
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (chunk) => {
        const embedding = await generateEmbedding(chunk.text);
        return { ...chunk, embedding };
      })
    );
    
    chunksWithEmbeddings.push(...batchResults);
    
    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, chunks.length), chunks.length);
    }
    
    // Yield to browser to prevent freezing
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  console.log(`[Embeddings] Generated ${chunksWithEmbeddings.length} embeddings`);
  return chunksWithEmbeddings;
}

/**
 * Simple keyword-based relevance scoring (no embeddings needed)
 * Returns chunks sorted by relevance score
 */
export function findRelevantChunks(chunks, query, topK = 5) {
  if (!chunks || chunks.length === 0) return [];
  if (!query || query.trim().length === 0) return chunks.slice(0, topK);

  // Extract keywords from query
  const queryKeywords = extractKeywords(query.toLowerCase());

  // Score each chunk
  const scored = chunks.map((chunk) => {
    const chunkText = chunk.text.toLowerCase();
    let score = 0;

    // Keyword matching with position weighting
    for (const keyword of queryKeywords) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "gi");
      const matches = chunkText.match(regex);
      if (matches) {
        score += matches.length * 2;
        
        // Bonus for early occurrence
        const firstIndex = chunkText.indexOf(keyword);
        if (firstIndex < 200) score += 1;
      }

      // Partial match bonus
      if (chunkText.includes(keyword)) {
        score += 0.5;
      }
    }

    // Bonus for multiple keyword co-occurrence
    const keywordsFound = queryKeywords.filter((kw) => chunkText.includes(kw)).length;
    if (keywordsFound > 1) {
      score += keywordsFound * 1.5;
    }

    return { ...chunk, score };
  });

  // Sort by score and return top K
  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text) {
  // Remove common stop words
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "should", "could", "may", "might", "must", "can", "this",
    "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
  ]);

  return text
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ""))
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 15); // Limit to top 15 keywords
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Combine relevant chunks into context string with source attribution
 */
export function buildContextFromChunks(chunks, maxChars = 3000) {
  if (!chunks || chunks.length === 0) return "";

  let context = "";
  let usedChars = 0;

  for (const chunk of chunks) {
    const header = `\n[Source: ${chunk.metadata.fileName}]\n`;
    const content = chunk.text + "\n";
    const total = header.length + content.length;

    if (usedChars + total > maxChars) break;

    context += header + content;
    usedChars += total;
  }

  return context.trim();
}
