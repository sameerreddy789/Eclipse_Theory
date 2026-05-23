import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "firebase-admin";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "dummy_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret",
});

export async function POST(req) {
  try {
    const { planId, userId } = await req.json();

    // In a real app, you'd create a Razorpay Subscription
    // but for this MVP, we can create a simple Order or 
    // initiate the Subscription flow.
    
    // Plan ID for ₹49/month would be pre-created in Razorpay Dashboard
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId || "plan_premium_49", // Example Plan ID
      customer_notify: 1,
      total_count: 12, // 1 year
      notes: {
        userId: userId,
      },
    });

    return NextResponse.json({ 
      id: subscription.id,
      status: subscription.status 
    });
  } catch (error) {
    console.error("Razorpay error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
