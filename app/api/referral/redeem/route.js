import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase-admin";
import admin from "firebase-admin";

export async function POST(request) {
  try {
    const { referralCode, newUserId } = await request.json();

    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Find the referrer with this code
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("referral_code", "==", referralCode).limit(1).get();

    if (snapshot.empty) {
      console.log("Invalid referral code used:", referralCode);
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    const referrerDoc = snapshot.docs[0];
    const referrerId = referrerDoc.id;

    // Prevent self-referral (though signup UI might prevent it, server should enforce)
    if (referrerId === newUserId) {
      return NextResponse.json({ error: "Self-referral not allowed" }, { status: 400 });
    }

    // 2. Award credits to Referrer (+1)
    await referrerDoc.ref.update({
      credits_remaining: admin.firestore.FieldValue.increment(1),
      referral_credits_earned: admin.firestore.FieldValue.increment(1),
      referrals_made: admin.firestore.FieldValue.arrayUnion(newUserId)
    });

    // 3. Award credits to Referred User (+1 bonus)
    await usersRef.doc(newUserId).update({
      credits_remaining: admin.firestore.FieldValue.increment(1)
    });

    // 4. Log the audit event
    await db.collection("referrals").add({
      referrer_uid: referrerId,
      referred_uid: newUserId,
      referral_code: referralCode,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, message: "Referral credits awarded" });

  } catch (error) {
    console.error("Referral redemption error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
