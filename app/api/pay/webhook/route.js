import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "../../lib/firebase-admin"; // We'll need to create this admin-sdk helper

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === "subscription.activated" || event.event === "subscription.charged") {
    const subscription = event.payload.subscription.entity;
    const userId = subscription.notes.userId;

    if (userId) {
      // Update User to Premium in Firestore
      await db.collection("users").doc(userId).update({
        plan: "premium",
        credits_remaining: 999, // Or handle daily cap differently
        subscription_id: subscription.id,
        next_billing_date: new Date(subscription.current_end * 1000)
      });
      
      console.log(`User ${userId} upgraded to Premium`);
    }
  }

  return NextResponse.json({ received: true });
}
