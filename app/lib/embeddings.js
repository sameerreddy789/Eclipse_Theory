/**
 * Local semantic embeddings using Transformers.js
 * Runs entirely in browser - no backend needed
 */

import { pipeline, env } from '@xenova/transformers';

// Configure to use local models (cached in browser)
env.allowLocalModels = true;
env.allowRemoteModels = true;

let embeddingPipeline = null;

/**
 * Initialize the embedding model (lazy loading)
 * Uses all-MiniLM-L6-v2 - small, fast, good quality
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('[Embeddings] Loading model (first time only, ~25MB)...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('[Embeddings] Model loaded and cached');
  }
  return embeddingPipeline;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text) {
  try {
    const pipe = await getEmbeddingPipeline();
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error('[Embeddings] Generation failed:', err);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function generateEmbeddings(texts, onProgress = null) {
  const embeddings = [];
  const pipe = await getEmbeddingPipeline();
  
  for (let i = 0; i < texts.length; i++) {
    const embedding = await generateEmbedding(texts[i]);
    embeddings.push(embedding);
    
    if (onProgress) {
      onProgress(i + 1, texts.length);
    }
  }
  
  return embeddings;
}

/**
 * Cosine similarity between two embeddings
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar chunks using semantic search
 */
export async function semanticSearch(queryText, chunks, topK = 5) {
  if (!chunks || chunks.length === 0) return [];
  
  console.log(`[Semantic Search] Searching ${chunks.length} chunks for: "${queryText}"`);
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(queryText);
  if (!queryEmbedding) {
    console.warn('[Semantic Search] Failed to generate query embedding');
    return chunks.slice(0, topK);
  }
  
  // Calculate similarity scores
  const scored = chunks.map((chunk) => {
    if (!chunk.embedding) {
      console.warn('[Semantic Search] Chunk missing embedding');
      return { ...chunk, score: 0 };
    }
    
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    return { ...chunk, score: similarity };
  });
  
  // Sort by similarity and return top K
  const results = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  
  console.log(`[Semantic Search] Top result score: ${results[0]?.score.toFixed(3)}`);
  
  return results;
}

/**
 * Hybrid search: combine semantic + keyword matching
 */
export async function hybridSearch(queryText, chunks, topK = 5) {
  if (!chunks || chunks.length === 0) return [];
  
  // Get semantic results
  const semanticResults = await semanticSearch(queryText, chunks, topK * 2);
  
  // Get keyword results (simple TF-IDF style)
  const keywords = extractKeywords(queryText.toLowerCase());
  const keywordScored = chunks.map((chunk) => {
    const chunkText = chunk.text.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      const matches = chunkText.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    
    return { ...chunk, keywordScore: score };
  });
  
  // Combine scores (70% semantic, 30% keyword)
  const combined = chunks.map((chunk) => {
    const semantic = semanticResults.find((r) => r.index === chunk.index);
    const keyword = keywordScored.find((r) => r.index === chunk.index);
    
    const semanticScore = semantic?.score || 0;
    const keywordScore = keyword?.keywordScore || 0;
    const normalizedKeyword = keywordScore / Math.max(...keywordScored.map(k => k.keywordScore), 1);
    
    const finalScore = (semanticScore * 0.7) + (normalizedKeyword * 0.3);
    
    return { ...chunk, score: finalScore };
  });
  
  return combined
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

function extractKeywords(text) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  ]);

  return text
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .slice(0, 15);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
