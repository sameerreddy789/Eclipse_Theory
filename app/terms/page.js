"use client";

import Link from "next/link";
import { Zap, ArrowLeft, Shield, Lock, FileText, Globe } from "lucide-react";
import "../globals.css";

export default function TermsPage() {
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
          <Shield size={14} color="var(--accent)" />
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px' }}>LEGAL DOCUMENT v1.0</span>
        </div>
        
        <h1 style={{ fontSize: '42px', fontWeight: '900', color: 'var(--accent)', marginBottom: '40px' }}>Terms of Service</h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '15px' }}>
          <section>
            <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>1. Acceptance of Terms</h2>
            <p>By accessing Eclipse Theory AI, you agree to be bound by these Terms of Service. If you do not agree, you are prohibited from using the platform.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>2. Use License</h2>
            <p>We grant you a personal, non-transferable license to use our AI orchestration engine for generating learning materials. You may not use the system for automated data harvesting or malicious activities.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>3. Credits & Payments</h2>
            <p>The system operates on a credit-based model. Free users receive 3 credits. Premium users receive 10 generations per day. Credits are non-refundable and tied to your authenticated profile.</p>
          </section>

          <section>
            <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: '800', marginBottom: '16px' }}>4. Content Ownership</h2>
            <p>You retain ownership of all materials you upload. Eclipse Theory AI retains ownership of the underlying algorithms and the unique structured formatting used in generation.</p>
          </section>
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '12px' }}>
        © 2026 ECLIPSE THEORY AI · LEGAL CORE
      </footer>
    </div>
  );
}
