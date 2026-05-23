"use client";

import Link from "next/link";
import { Zap, ArrowLeft, Lock, ShieldCheck, Eye, Database } from "lucide-react";
import "../globals.css";

export default function PrivacyPage() {
  return (
    <div className="landing-page" style={{ minHeight: '100vh', background: '#050502' }}>
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="logo">
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--accent)' }}>
              <ArrowLeft size={18} />
              <span style={{ fontWeight: '900' }}>BACK TO SYSTEM</span>
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--border)', borderRadius: '99px', marginBottom: '24px' }}>
          <Lock size={14} color="var(--accent)" />
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px' }}>DATA PRIVACY CORE</span>
        </div>
        
        <h1 style={{ fontSize: '42px', fontWeight: '900', color: 'var(--accent)', marginBottom: '40px' }}>Privacy Policy</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '15px' }}>
          <section>
            <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>1. Data Collection</h2>
            <p>We only collect the data necessary to provide our services: your email for authentication, and the documents you upload for AI processing. We do not sell or share your personal data with third parties.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>2. Document Processing</h2>
            <p>Documents are processed in memory and encrypted during transit. Our AI models (Gemini, Llama) receive your content to generate summaries, but do not use your data for training purposes unless explicitly consented.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>3. Analytics & Cookies</h2>
            <p>We use essential cookies to maintain your login session. Behavioral analytics are used to score user intent and prevent system abuse.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>4. Your Rights</h2>
            <p>You have the right to delete your account and all associated documents at any time. Your data is your property.</p>
          </section>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '12px' }}>
        © 2026 ECLIPSE THEORY AI · PRIVACY CORE
      </footer>
    </div>
  );
}
