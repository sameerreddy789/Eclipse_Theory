"use client";

import { CheckCircle2, Zap, X } from "lucide-react";
import { useState } from "react";

export default function UpgradeModal({ user, onClose, onUpgrade }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    // Simulate Razorpay / Backend call
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/pay/subscribe", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({ userId: user.uid, planId: "plan_premium_49" })
      });
      
      // For demo: automatically trigger the webhook effect since we don't have real Razorpay keys set up
      // In production, this would be handled by the real Razorpay webhook handler
      alert("In production, this would open Razorpay. For this demo, we'll simulate a successful payment.");
      onUpgrade(); 
    } catch (e) {
      alert("Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upgrade to Premium</h3>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div style={{ padding: '20px 0' }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>₹49<span style={{ fontSize: 16, color: 'var(--text-dim)' }}>/mo</span></div>
            <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Unlock the full power of Eclipse Theory AI.</p>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', textAlign: 'left', display: 'inline-block' }}>
            {["10 Generations per day", "Unlimited document uploads", "Priority AI processing queue", "Premium badge & Support", "Advanced OCR mode"].map((feat, i) => (
              <li key={i} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                <CheckCircle2 size={16} color="var(--accent)" /> {feat}
              </li>
            ))}
          </ul>

          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-save-key" 
            style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '800', marginTop: 20 }}
          >
            {loading ? "INITIALIZING..." : "UPGRADE NOW"}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12 }}>Secure payment powered by Razorpay</p>
        </div>
      </div>
    </div>
  );
}
