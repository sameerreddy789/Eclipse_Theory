"use client";

import Link from "next/link";
import { Zap, Shield, Rocket, Users, BookOpen, Star, ArrowRight, CheckCircle2, Mail, Linkedin, ChevronDown, Award } from "lucide-react";
import "./globals.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-icon">
              <Zap className="text-black" size={16} />
            </div>
            <span style={{ fontWeight: '900', letterSpacing: '-0.5px' }}>ECLIPSE THEORY</span>
          </div>
          <div className="nav-right">
            <Link href="#how-it-works" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Process</Link>
            <Link href="#pricing" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Pricing</Link>
            <Link href="/login" className="api-key-btn" style={{ fontWeight: '700' }}>Sign In</Link>
            <Link href="/signup" className="btn-save-key" style={{ display: 'flex', alignItems: 'center', height: '32px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" style={{ paddingTop: '140px', paddingBottom: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)', zIndex: -1 }}></div>
        <div className="hero">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--border)', borderRadius: '99px', marginBottom: '24px' }}>
            <Award size={14} color="var(--accent)" />
            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px' }}>Voted #1 AI Learning Platform 2026</span>
          </div>
          <h1 className="hero-title" style={{ textShadow: '0 0 30px rgba(212, 175, 55, 0.1)' }}>
            Master Any Subject <br />
            <span style={{ color: 'var(--accent)', filter: 'brightness(1.1)' }}>with AI Intelligence.</span>
          </h1>
          <p className="hero-subtitle" style={{ margin: '0 auto 40px', maxWidth: '600px' }}>
            Upload your documents, and our AI pipeline will generate exam-ready study notes, 
            semantic search summaries, and Anki-compatible content in seconds.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/signup" className="btn-save-key" style={{ padding: '14px 36px', fontSize: '16px', borderRadius: '50px', boxShadow: '0 10px 20px -5px rgba(212, 175, 55, 0.2)' }}>
              Start Learning Free
            </Link>
            <Link href="#how-it-works" className="btn-test-key" style={{ padding: '14px 36px', fontSize: '16px', borderRadius: '50px', background: 'transparent', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: '80px 24px', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent)', marginBottom: '10px' }}>The Three-Step Process</h2>
          <p style={{ color: 'var(--text-muted)' }}>Engineered for depth. Built for speed.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
          {[
            { step: "01", title: "Feed", desc: "Upload PDFs, hand-written notes, or slides into our secure OCR-ready engine." },
            { step: "02", title: "Analyze", desc: "Multi-stage agents perform semantic search and knowledge synthesis." },
            { step: "03", title: "Master", desc: "Get master guides and instantly export to Anki, Notion, or high-fidelity PDF." }
          ].map((item, i) => (
            <div key={i} style={{ padding: '30px', background: 'var(--bg-subtle)', borderRadius: '20px', border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ fontSize: '40px', fontWeight: '900', color: 'rgba(212, 175, 55, 0.05)', position: 'absolute', top: '15px', right: '20px' }}>{item.step}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)', marginBottom: '12px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compact Pricing Section */}
      <section id="pricing" style={{ padding: '80px 24px', background: 'rgba(212, 175, 55, 0.01)', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '10px', color: 'var(--accent)' }}>Choose Your Tier</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>One-time payment for lifetime value.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', maxWidth: '700px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Free Plan */}
          <div style={{ flex: '1', minWidth: '300px', background: 'var(--bg-subtle)', borderColor: 'var(--border)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-muted)' }}>Standard</h3>
            <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '20px' }}>₹0</div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '24px', fontSize: '13px' }}>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}><CheckCircle2 size={14} color="var(--accent)" /> 3 Initial Credits</li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}><CheckCircle2 size={14} color="var(--accent)" /> 3 Parallel Uploads</li>
            </ul>
            <Link href="/signup" className="btn-test-key" style={{ display: 'block', padding: '10px', borderRadius: '10px', fontWeight: '700', borderColor: 'var(--accent)', color: 'var(--accent)', fontSize: '13px' }}>Start Free</Link>
          </div>

          {/* Premium Plan */}
          <div style={{ flex: '1', minWidth: '300px', background: 'var(--bg-elevated)', borderColor: 'var(--accent)', borderWidth: '2px', padding: '30px', borderRadius: '20px', border: '2px solid var(--accent)', position: 'relative', textAlign: 'center', boxShadow: '0 10px 30px -10px rgba(212, 175, 55, 0.2)' }}>
            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#000', padding: '2px 12px', borderRadius: '20px', fontSize: '9px', fontWeight: '900' }}>BEST VALUE</div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--accent)' }}>Premium</h3>
            <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '20px', color: 'var(--accent)' }}>₹49 <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '24px', fontSize: '13px' }}>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontWeight: '600' }}><CheckCircle2 size={14} color="var(--accent)" /> 10 Gens / Day</li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontWeight: '600' }}><CheckCircle2 size={14} color="var(--accent)" /> Unlimited Material</li>
            </ul>
            <Link href="/signup" className="btn-save-key" style={{ display: 'block', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '900' }}>Go Pro</Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 24px', background: '#050502', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '20px', maxWidth: '1000px', margin: '0 auto', flexWrap: 'wrap' }}>
          {[
            { name: "Arjun Reddy", role: "Medical Student", text: "Turned my anatomy notes into an Anki deck in minutes. A game changer." },
            { name: "Sarah J.", role: "Full-stack Dev", text: "The Mermaid diagram generation is scarily accurate. Worth every penny." }
          ].map((t, i) => (
            <div key={i} style={{ flex: '1', minWidth: '300px', padding: '30px', background: 'rgba(212, 175, 55, 0.03)', borderRadius: '20px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: '16px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="var(--accent)" color="var(--accent)" />)}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontStyle: 'italic', marginBottom: '20px' }}>"{t.text}"</p>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent)' }}>{t.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section - Side by Side with Official Logos */}
      <section id="contact" style={{ padding: '80px 24px', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'rgba(212, 175, 55, 0.01)' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent)', marginBottom: '40px' }}>Get In Touch</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <a href="mailto:vediums@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)', fontWeight: '700', padding: '14px 28px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            vediums@gmail.com
          </a>
          <a href="https://www.linkedin.com/in/sameer-reddy-vedium-goat" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)', fontWeight: '700', padding: '14px 28px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            Official LinkedIn
          </a>
        </div>
      </section>

      {/* Modern Footer */}
      <footer style={{ padding: '60px 24px', background: '#050502', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
          <div style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '20px' }}>
              <Zap color="var(--accent)" size={20} fill="var(--accent)" />
              <span style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '18px' }}>ECLIPSE THEORY</span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '12px', lineHeight: '1.6' }}>The world's most advanced AI study platform. Built for knowledge architects who refuse to settle for surface-level learning.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '60px' }}>
            <div>
              <h4 style={{ color: 'var(--text)', fontSize: '12px', fontWeight: '800', marginBottom: '15px', textTransform: 'uppercase' }}>Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <li><Link href="#how-it-works" style={{ color: 'var(--text-dim)' }}>Process</Link></li>
                <li><Link href="#pricing" style={{ color: 'var(--text-dim)' }}>Pricing</Link></li>
                <li><Link href="/dashboard" style={{ color: 'var(--text-dim)' }}>Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'var(--text)', fontSize: '12px', fontWeight: '800', marginBottom: '15px', textTransform: 'uppercase' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <li><Link href="#" style={{ color: 'var(--text-dim)' }}>Terms</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-dim)' }}>Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: '1000px', margin: '40px auto 0', paddingTop: '20px', borderTop: '1px solid rgba(212, 175, 55, 0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)' }}>
          <span>© 2026 ECLIPSE THEORY AI. ALL RIGHTS RESERVED.</span>
          <span style={{ color: 'var(--accent)', fontWeight: '800' }}>SECURE PRODUCTION NODE</span>
        </div>
      </footer>
    </div>
  );
}
