import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Tracks a user event to Firestore for n8n pipelines & analytics
 * @param {string} userId - User UID
 * @param {string} eventType - e.g., 'pricing_viewed', 'file_uploaded'
 * @param {string} category - e.g., 'usage', 'billing', 'engagement'
 * @param {object} metadata - Optional event metadata payload
 */
export async function trackEvent(userId, eventType, category, metadata = {}) {
  if (!userId) return;
  try {
    await addDoc(collection(db, "events"), {
      user_id: userId,
      event_type: eventType,
      category: category,
      metadata: metadata,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Event tracking failed:", eventType, err);
  }
}
