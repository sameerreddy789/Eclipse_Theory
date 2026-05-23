import { NextResponse } from "next/server";
import { verifyAuth } from "../../lib/auth-server";
import { db } from "../../lib/firebase-admin";
import admin from "firebase-admin";

export async function POST(request) {
  // 1. Authenticate User
  const authUser = await verifyAuth(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uid } = authUser;
  const { action, payload } = await request.json();

  try {
    // 2. Rate Limiting & Credit Gate
    if (action === "GENERATE_TOPIC" || action === "GENERATE_MODULE") {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });

      // --- Cooldown (30 seconds) ---
      const lastGen = userData.last_generation?.toDate() || new Date(0);
      const now = new Date();
      const diffSecs = (now - lastGen) / 1000;
      
      if (diffSecs < 30) {
        return NextResponse.json({ 
          error: `Please wait ${Math.ceil(30 - diffSecs)}s between generations`, 
          code: "COOLDOWN_ACTIVE" 
        }, { status: 429 });
      }

      // --- Tier Caps ---
      if (userData.plan === 'free') {
        if (userData.credits_remaining <= 0) {
          await db.collection("events").add({
            user_id: uid,
            event_type: "credits_exhausted",
            category: "billing",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            plan: "free"
          });
          return NextResponse.json({ error: "No free credits left. Please upgrade.", code: "CREDITS_EXHAUSTED" }, { status: 402 });
        }
      } else if (userData.plan === 'premium') {
        // Daily Limit Check (10/day)
        const lastReset = userData.daily_reset_at?.toDate() || new Date(0);
        const dayDiff = (now - lastReset) / (1000 * 60 * 60 * 24);
        
        let dailyCount = userData.daily_generations || 0;
        if (dayDiff >= 1) {
          dailyCount = 0; // Reset counter if a day has passed
          await userRef.update({ daily_generations: 0, daily_reset_at: admin.firestore.FieldValue.serverTimestamp() });
        }

        if (dailyCount >= 10) {
          return NextResponse.json({ error: "Daily premium limit (10) reached.", code: "DAILY_LIMIT_REACHED" }, { status: 429 });
        }
      }

      // 3. Atomically Deduct Credit & Update Rate Limit
      const updates = {
        last_generation: admin.firestore.FieldValue.serverTimestamp(),
        last_active: admin.firestore.FieldValue.serverTimestamp()
      };

      if (userData.plan === 'free') {
        updates.credits_remaining = admin.firestore.FieldValue.increment(-1);
        updates.generations_total = admin.firestore.FieldValue.increment(1);
      } else {
        updates.daily_generations = admin.firestore.FieldValue.increment(1);
        updates.generations_total = admin.firestore.FieldValue.increment(1);
      }

      await userRef.update(updates);

      // 4. Log usage event
      await db.collection("events").add({
        user_id: uid,
        event_type: "generation_started",
        category: "usage",
        metadata: { action, ...payload },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        plan: userData.plan
      });
    }

    // Return success to proceed with client-side AI calls (for Vercel timeout safety)
    // or handle the AI call here if short enough.
    return NextResponse.json({ success: true, authorized: true });

  } catch (error) {
    console.error("Secure API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
