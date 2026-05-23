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
    // 2. Credit Gate for Generation actions
    if (action === "GENERATE_TOPIC" || action === "GENERATE_MODULE") {
      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();
      const userData = userDoc.data();

      if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });

      // Check if user has credits (Skip check for premium if you want)
      if (userData.plan === 'free' && userData.credits_remaining <= 0) {
        // Track 'credits_exhausted' event for n8n
        await db.collection("events").add({
          user_id: uid,
          event_type: "credits_exhausted",
          category: "billing",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          plan: userData.plan
        });
        return NextResponse.json({ error: "Insufficient credits", code: "CREDITS_EXHAUSTED" }, { status: 402 });
      }

      // 3. Atomically Deduct Credit
      await userRef.update({
        credits_remaining: admin.firestore.FieldValue.increment(-1),
        generations_total: admin.firestore.FieldValue.increment(1),
        last_active: admin.firestore.FieldValue.serverTimestamp()
      });

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
