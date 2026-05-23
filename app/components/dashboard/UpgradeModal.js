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
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="modal-content" style={{ maxWidth: 450, background: 'var(--bg-subtle)', border: '2px solid var(--accent)', boxShadow: '0 20px 50px rgba(212, 175, 55, 0.15)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ color: 'var(--accent)', fontWeight: '900', letterSpacing: '1px' }}>UPGRADE TO PREMIUM</h3>
          <button onClick={onClose} className="modal-close" style={{ color: 'var(--accent)' }}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px' }}>
          <div style={{ padding: '10px 0' }}>
            <div style={{ fontSize: 56, fontWeight: '900', color: 'var(--accent)', marginBottom: 4 }}>₹49<span style={{ fontSize: 18, color: 'var(--text-dim)', fontWeight: '600' }}>/mo</span></div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: '600' }}>Unlock the full power of Eclipse Theory AI.</p>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '30px 0', textAlign: 'left', display: 'inline-block' }}>
            {["10 Generations per day", "Unlimited document uploads", "Priority AI processing queue", "Premium badge & Support", "Advanced OCR mode"].map((feat, i) => (
              <li key={i} style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--text)', fontWeight: '500' }}>
                <CheckCircle2 size={18} color="var(--accent)" /> {feat}
              </li>
            ))}
          </ul>

          <button 
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-save-key" 
            style={{ width: '100%', padding: '18px', fontSize: '18px', fontWeight: '900', marginTop: 10, background: 'var(--accent)', color: '#000', borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(212, 175, 55, 0.2)' }}
          >
            {loading ? "INITIALIZING..." : "UPGRADE NOW"}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 16, fontWeight: '700', letterSpacing: '0.5px' }}>SECURE PAYMENT POWERED BY RAZORPAY</p>
        </div>
      </div>
    </div>
  );
}
