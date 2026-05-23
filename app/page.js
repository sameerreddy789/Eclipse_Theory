"use client";

import Link from "next/link";
import { Zap, Shield, Rocket, Users, BookOpen, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import "./globals.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-icon">
              <Zap className="text-[#d4af37] w-5 h-5" />
            </div>
            Eclipse Theory
          </div>
          <div className="nav-right">
            <Link href="/login" className="api-key-btn">Sign In</Link>
            <Link href="/signup" className="btn-save-key" style={{ display: 'flex', alignItems: 'center', height: '32px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="hero-title">
          Master Any Subject <br />
          <span style={{ color: 'var(--accent)' }}>with AI Intelligence.</span>
        </h1>
        <p className="hero-subtitle">
          Upload your documents, and our AI pipeline will generate exam-ready study notes, 
          semantic search summaries, and Anki-compatible content in seconds.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/signup" className="btn-save-key" style={{ padding: '12px 32px', fontSize: '16px' }}>
            Start Learning Free
          </Link>
          <Link href="#pricing" className="btn-test-key" style={{ padding: '12px 32px', fontSize: '16px' }}>
            View Pricing
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '12px' }}>Choose Your Plan</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Simple, transparent pricing for every student.</p>
        
        <div className="pricing-grid">
          {/* Free Plan */}
          <div className="pricing-card">
            <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Free</h3>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>₹0</div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '32px' }}>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} /> 3 Initial Credits</li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} /> 3 Uploads at a time</li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} /> Standard Support</li>
            </ul>
            <Link href="/signup" className="btn-test-key" style={{ display: 'block' }}>Sign Up</Link>
          </div>

          {/* Premium Plan */}
          <div className="pricing-card premium">
            <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Premium</h3>
            <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px' }}>₹49 <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '32px' }}>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--accent)" /> 10 Generations / Day</li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--accent)" /> Unlimited Uploads</li>
              <li style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16} color="var(--accent)" /> Priority AI Queue</li>
            </ul>
            <Link href="/signup" className="btn-save-key" style={{ display: 'block' }}>Upgrade Now</Link>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '60px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '14px' }}>
        Eclipse Theory — Master Learning Document Generator
      </footer>
    </div>
  );
}
