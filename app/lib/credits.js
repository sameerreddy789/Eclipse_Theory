import { doc, updateDoc, increment, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Deduct a credit from a user's account and log the usage event.
 * @param {string} userId - The UID of the user
 * @param {string} generationType - Type of generation for logging
 */
export async function deductCredit(userId, generationType = "DOCUMENT_GENERATION") {
  const userRef = doc(db, "users", userId);
  
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) throw new Error("User not found");
    
    const data = userDoc.data();
    
    // Safety check for credits
    if (data.credits_remaining <= 0 && data.plan !== 'premium') {
      throw new Error("Insufficient credits");
    }

    // Atomic update
    await updateDoc(userRef, {
      credits_remaining: increment(-1),
      generations_total: increment(1),
      last_active: serverTimestamp()
    });

    // Log the event for n8n/Analytics
    await addDoc(collection(db, "events"), {
      user_id: userId,
      type: "GENERATION_COMPLETED",
      metadata: {
        generation_type: generationType,
        plan: data.plan
      },
      timestamp: serverTimestamp()
    });

    return { success: true };
  } catch (err) {
    console.error("Credit deduction failed:", err);
    throw err;
  }
}

/**
 * Grant referral credits
 * @param {string} referralCode - The referral code used
 * @param {string} newUserId - The ID of the newly signed up user
 */
export async function processReferral(referralCode, newUserId) {
  // 1. Find user with this referral code
  // 2. Increment their credits
  // 3. Log the event
  // Note: This logic is better placed in a Firebase Cloud Function for security.
}
