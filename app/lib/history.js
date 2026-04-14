/**
 * History management for generated documents
 * Stores in localStorage with metadata
 */

const HISTORY_KEY = "eclipse-theory-history-v1";
const MAX_HISTORY_ITEMS = 50; // Limit to prevent localStorage overflow

/**
 * Save a generated document to history
 */
export function saveToHistory(courseName, modules, output, metadata = {}) {
  try {
    const history = getHistory();
    
    const item = {
      id: Date.now().toString(),
      courseName: courseName.trim(),
      moduleCount: modules.length,
      topicCount: modules.reduce((sum, m) => sum + m.topics.length, 0),
      output,
      timestamp: Date.now(),
      date: new Date().toISOString(),
      depth: metadata.depth || "detailed",
      fileCount: metadata.fileCount || 0,
      ...metadata,
    };
    
    // Add to beginning of array (most recent first)
    history.unshift(item);
    
    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
      history.splice(MAX_HISTORY_ITEMS);
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return item.id;
  } catch (err) {
    console.error("Failed to save to history:", err);
    return null;
  }
}

/**
 * Get all history items
 */
export function getHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    
    const history = JSON.parse(stored);
    return Array.isArray(history) ? history : [];
  } catch (err) {
    console.error("Failed to load history:", err);
    return [];
  }
}

/**
 * Get a single history item by ID
 */
export function getHistoryItem(id) {
  const history = getHistory();
  return history.find((item) => item.id === id);
}

/**
 * Delete a history item by ID
 */
export function deleteHistoryItem(id) {
  try {
    const history = getHistory();
    const filtered = history.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error("Failed to delete history item:", err);
    return false;
  }
}

/**
 * Clear all history
 */
export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (err) {
    console.error("Failed to clear history:", err);
    return false;
  }
}

/**
 * Get history statistics
 */
export function getHistoryStats() {
  const history = getHistory();
  
  if (history.length === 0) {
    return {
      totalDocuments: 0,
      totalTopics: 0,
      totalSizeMB: "0.00",
      oldestDate: null,
      newestDate: null,
    };
  }
  
  const totalTopics = history.reduce((sum, item) => sum + (item.topicCount || 0), 0);
  const totalSize = history.reduce((sum, item) => sum + (item.output?.length || 0), 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  
  const dates = history.map((item) => item.timestamp).sort((a, b) => a - b);
  
  return {
    totalDocuments: history.length,
    totalTopics,
    totalSizeMB,
    oldestDate: new Date(dates[0]),
    newestDate: new Date(dates[dates.length - 1]),
  };
}

/**
 * Format date for display
 */
export function formatHistoryDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get file size in human-readable format
 */
export function formatHistorySize(text) {
  const bytes = text?.length || 0;
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
