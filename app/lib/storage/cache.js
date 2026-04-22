/**
 * Client-side caching system for Eclipse Theory
 * Stores processed documents, analysis results, and generated content
 */

const CACHE_VERSION = "v2";
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit for localStorage

/**
 * Generate hash from string (simple but fast)
 */
async function simpleHash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/**
 * Generate hash from file
 */
export async function hashFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

/**
 * Get cache key with version prefix
 */
function getCacheKey(type, identifier) {
  return `eclipse_${CACHE_VERSION}_${type}_${identifier}`;
}

/**
 * Check if cache is too large and clear old entries
 */
function checkCacheSize() {
  let totalSize = 0;
  const entries = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("eclipse_")) {
      const value = localStorage.getItem(key);
      const size = value?.length || 0;
      totalSize += size;
      entries.push({ key, size, timestamp: getTimestamp(key) });
    }
  }

  // If over limit, remove oldest entries
  if (totalSize > MAX_CACHE_SIZE) {
    entries.sort((a, b) => a.timestamp - b.timestamp);
    let removed = 0;
    for (const entry of entries) {
      if (totalSize - removed < MAX_CACHE_SIZE * 0.8) break; // Clear to 80%
      localStorage.removeItem(entry.key);
      removed += entry.size;
    }
    console.log(`[Cache] Cleared ${removed} bytes of old cache entries`);
  }
}

function getTimestamp(key) {
  try {
    const value = localStorage.getItem(key);
    const data = JSON.parse(value);
    return data.timestamp || 0;
  } catch {
    return 0;
  }
}

// ── DOCUMENT CHUNKS CACHE ──

/**
 * Cache processed document chunks
 */
export async function cacheDocumentChunks(file, chunks) {
  try {
    const hash = await hashFile(file);
    const key = getCacheKey("chunks", hash);
    const data = {
      fileName: file.name,
      fileSize: file.size,
      chunks,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    checkCacheSize();
    return hash;
  } catch (err) {
    console.warn("[Cache] Failed to cache chunks:", err);
    return null;
  }
}

/**
 * Get cached document chunks
 */
export async function getCachedDocumentChunks(file) {
  try {
    const hash = await hashFile(file);
    const key = getCacheKey("chunks", hash);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    
    // Validate cache
    if (data.fileName !== file.name || data.fileSize !== file.size) {
      localStorage.removeItem(key);
      return null;
    }

    console.log(`[Cache] Hit: Document chunks for "${file.name}"`);
    return { chunks: data.chunks, hash };
  } catch (err) {
    console.warn("[Cache] Failed to get cached chunks:", err);
    return null;
  }
}

// ── ANALYSIS RESULTS CACHE ──

/**
 * Cache analysis results for a topic
 */
export async function cacheAnalysisResult(topicName, moduleName, documentHashes, extractedInfo) {
  try {
    const sortedHashes = [...documentHashes].sort();
    const identifier = await simpleHash(`${topicName}_${moduleName}_${sortedHashes.join("_")}`);
    const key = getCacheKey("analysis", identifier);
    const data = {
      topicName,
      moduleName,
      documentHashes: sortedHashes,
      extractedInfo,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    checkCacheSize();
  } catch (err) {
    console.warn("[Cache] Failed to cache analysis:", err);
  }
}

/**
 * Get cached analysis results
 */
export async function getCachedAnalysisResult(topicName, moduleName, documentHashes) {
  try {
    const sortedHashes = [...documentHashes].sort();
    const identifier = await simpleHash(`${topicName}_${moduleName}_${sortedHashes.join("_")}`);
    const key = getCacheKey("analysis", identifier);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    
    // Validate cache (check if document hashes match)
    const cachedHashes = [...data.documentHashes].sort().join("_");
    const currentHashes = sortedHashes.join("_");
    if (cachedHashes !== currentHashes) {
      localStorage.removeItem(key);
      return null;
    }

    // Validate topic and module names match exactly
    if (data.topicName !== topicName || data.moduleName !== moduleName) {
      localStorage.removeItem(key);
      return null;
    }

    console.log(`[Cache] Hit: Analysis for "${topicName}"`);
    return data.extractedInfo;
  } catch (err) {
    console.warn("[Cache] Failed to get cached analysis:", err);
    return null;
  }
}

// ── GENERATED CONTENT CACHE ──

/**
 * Cache entire generated document
 */
export async function cacheGeneratedDocument(courseName, modules, documentHashes, markdown, depth = "detailed") {
  try {
    const sortedHashes = [...documentHashes].sort();
    const moduleStr = modules.map((m) => `${m.name}:${m.topics.join(",")}`).join("|");
    const identifier = await simpleHash(`${courseName}_${depth}_${moduleStr}_${sortedHashes.join("_")}`);
    const key = getCacheKey("document", identifier);
    const data = {
      courseName,
      modules,
      documentHashes: sortedHashes,
      depth,
      markdown,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    checkCacheSize();
  } catch (err) {
    console.warn("[Cache] Failed to cache document:", err);
  }
}

/**
 * Get cached generated document
 */
export async function getCachedGeneratedDocument(courseName, modules, documentHashes, depth = "detailed") {
  try {
    const sortedHashes = [...documentHashes].sort();
    const moduleStr = modules.map((m) => `${m.name}:${m.topics.join(",")}`).join("|");
    const identifier = await simpleHash(`${courseName}_${depth}_${moduleStr}_${sortedHashes.join("_")}`);
    const key = getCacheKey("document", identifier);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const data = JSON.parse(cached);
    
    // Validate cache — document hashes must match
    const cachedHashes = [...data.documentHashes].sort().join("_");
    const currentHashes = sortedHashes.join("_");
    if (cachedHashes !== currentHashes) {
      localStorage.removeItem(key);
      return null;
    }

    // Validate cache — course name must match exactly
    if (data.courseName !== courseName) {
      localStorage.removeItem(key);
      return null;
    }

    // Validate cache — modules structure must match exactly
    const cachedModuleStr = data.modules.map((m) => `${m.name}:${m.topics.join(",")}`).join("|");
    if (cachedModuleStr !== moduleStr) {
      localStorage.removeItem(key);
      return null;
    }

    // Validate cache — depth must match
    if (data.depth && data.depth !== depth) {
      localStorage.removeItem(key);
      return null;
    }

    console.log(`[Cache] Hit: Full document for "${courseName}"`);
    return data.markdown;
  } catch (err) {
    console.warn("[Cache] Failed to get cached document:", err);
    return null;
  }
}

// ── CACHE MANAGEMENT ──

/**
 * Clear all Eclipse Theory caches
 */
export function clearAllCaches() {
  let cleared = 0;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("eclipse_")) {
      localStorage.removeItem(key);
      cleared++;
    }
  }
  console.log(`[Cache] Cleared ${cleared} cache entries`);
  return cleared;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  let totalSize = 0;
  let counts = { chunks: 0, analysis: 0, document: 0 };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("eclipse_")) {
      const value = localStorage.getItem(key);
      totalSize += value?.length || 0;
      
      if (key.includes("_chunks_")) counts.chunks++;
      else if (key.includes("_analysis_")) counts.analysis++;
      else if (key.includes("_document_")) counts.document++;
    }
  }

  return {
    totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    counts,
    percentUsed: ((totalSize / MAX_CACHE_SIZE) * 100).toFixed(1),
  };
}

/**
 * Clear old cache entries (older than 7 days)
 */
export function clearOldCaches(daysOld = 7) {
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;
  let cleared = 0;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("eclipse_")) {
      try {
        const value = localStorage.getItem(key);
        const data = JSON.parse(value);
        if (data.timestamp && data.timestamp < cutoff) {
          localStorage.removeItem(key);
          cleared++;
        }
      } catch {
        // Invalid cache entry, remove it
        localStorage.removeItem(key);
        cleared++;
      }
    }
  }

  console.log(`[Cache] Cleared ${cleared} old cache entries`);
  return cleared;
}
