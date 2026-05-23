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
              <Zap className="text-black w-5 h-5" />
            </div>
            <span style={{ fontWeight: '900', letterSpacing: '-0.5px' }}>ECLIPSE THEORY</span>
          </div>
          <div className="nav-right">
            <Link href="/login" className="api-key-btn" style={{ fontWeight: '600' }}>Sign In</Link>
            <Link href="/signup" className="btn-save-key" style={{ display: 'flex', alignItems: 'center', height: '32px' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" style={{ paddingTop: '160px', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)', zIndex: -1 }}></div>
        <div className="hero">
          <h1 className="hero-title" style={{ textShadow: '0 0 30px rgba(212, 175, 55, 0.2)' }}>
            Master Any Subject <br />
            <span style={{ color: 'var(--accent)', filter: 'brightness(1.2)' }}>with AI Intelligence.</span>
          </h1>
          <p className="hero-subtitle" style={{ margin: '0 auto 40px' }}>
            Upload your documents, and our AI pipeline will generate exam-ready study notes, 
            semantic search summaries, and Anki-compatible content in seconds.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/signup" className="btn-save-key" style={{ padding: '16px 40px', fontSize: '18px', borderRadius: '50px', boxShadow: '0 10px 20px -5px rgba(212, 175, 55, 0.3)' }}>
              Start Learning Free
            </Link>
            <Link href="#pricing" className="btn-test-key" style={{ padding: '16px 40px', fontSize: '18px', borderRadius: '50px', background: 'transparent', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section - More Compact & Professional */}
      <section id="pricing" style={{ padding: '80px 24px', background: 'rgba(212, 175, 55, 0.01)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '10px', color: 'var(--accent)' }}>Choose Your Plan</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Simple, transparent pricing for every student.</p>
        </div>
        
        <div className="pricing-grid" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Free Plan */}
          <div className="pricing-card" style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border)', padding: '30px', borderRadius: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', color: 'var(--text-muted)' }}>Free</h3>
            <div style={{ fontSize: '36px', fontWeight: '900', marginBottom: '20px' }}>₹0</div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '30px', fontSize: '14px' }}>
              <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}><CheckCircle2 size={16} color="var(--accent)" /> 3 Initial Credits</li>
              <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}><CheckCircle2 size={16} color="var(--accent)" /> 3 Uploads at a time</li>
            </ul>
            <Link href="/signup" className="btn-test-key" style={{ display: 'block', padding: '10px', borderRadius: '10px', fontWeight: '700', borderColor: 'var(--accent)', color: 'var(--accent)', fontSize: '14px' }}>Sign Up</Link>
          </div>

          {/* Premium Plan */}
          <div className="pricing-card premium" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--accent)', borderWidth: '2px', padding: '30px', borderRadius: '20px', position: 'relative', textAlign: 'center', boxShadow: '0 15px 30px -10px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--accent)', color: '#000', padding: '2px 10px', borderRadius: '15px', fontSize: '9px', fontWeight: '900' }}>BEST VALUE</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', color: 'var(--accent)' }}>Premium</h3>
            <div style={{ fontSize: '36px', fontWeight: '900', marginBottom: '20px', color: 'var(--accent)' }}>₹49 <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '30px', fontSize: '14px' }}>
              <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', fontWeight: '600' }}><CheckCircle2 size={16} color="var(--accent)" /> 10 Gens / Day</li>
              <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', fontWeight: '600' }}><CheckCircle2 size={16} color="var(--accent)" /> Unlimited Uploads</li>
            </ul>
            <Link href="/signup" className="btn-save-key" style={{ display: 'block', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '900' }}>Upgrade Now</Link>
          </div>
        </div>
      </section>

      {/* Contact Section - Side by Side Professional Support */}
      <section id="contact" style={{ padding: '80px 24px', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent)', marginBottom: '16px' }}>Get In Touch</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 40px', fontSize: '15px' }}>
          Connect with the architects behind Eclipse Theory. We're here to support your knowledge synthesis journey.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Gmail Support */}
          <a href="mailto:vediums@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)', fontWeight: '700', padding: '16px 32px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'all 150ms ease' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 7L12 13L22 7M2 7V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V7M2 7L4 5.8C4.5 5.5 5.1 5.5 5.6 5.8L12 9.5L18.4 5.8C18.9 5.5 19.5 5.5 20 5.8L22 7" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            GMAIL SUPPORT
          </a>
          
          {/* LinkedIn Profile */}
          <a href="https://www.linkedin.com/in/sameer-reddy-vedium-goat" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text)', fontWeight: '700', padding: '16px 32px', background: 'var(--bg-subtle)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'all 150ms ease' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 0H5C2.239 0 0 2.239 0 5V19C0 21.761 2.239 24 5 24H19C21.761 24 24 21.761 24 19V5C24 2.239 21.761 0 19 0ZM8 19H5V8H8V19ZM6.5 6.732C5.534 6.732 4.75 5.942 4.75 4.968C4.75 3.994 5.534 3.204 6.5 3.204C7.466 3.204 8.25 3.994 8.25 4.968C8.25 5.942 7.466 6.732 6.5 6.732ZM19 19H16V13.396C16 12.028 15.737 10.269 13.842 10.269C11.947 10.269 11.658 11.748 11.658 13.297V19H8.658V8H11.535V9.501H11.575C11.975 8.745 12.948 7.946 14.403 7.946C17.428 7.946 18 9.938 18 12.529V19H19Z"/>
            </svg>
            LINKEDIN
          </a>
        </div>
      </section>

      {/* Professional Footer */}
      <footer style={{ padding: '60px 24px', background: '#050502', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '20px' }}>
              <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                <Zap className="text-black" size={20} />
              </div>
              <span style={{ fontWeight: '900', color: 'var(--accent)', fontSize: '18px' }}>ECLIPSE THEORY</span>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', lineHeight: '1.6' }}>
              The next-gen AI document SaaS designed for deep learning, exam preparation, and knowledge synthesis.
            </p>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="#features" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Features</Link></li>
              <li><Link href="#pricing" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Pricing</Link></li>
              <li><Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li><Link href="/terms" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Terms of Service</Link></li>
              <li><Link href="/privacy" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '800', marginBottom: '20px', textTransform: 'uppercase' }}>Connect</h4>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href="#" style={{ color: 'var(--text-muted)' }}><Users size={20} /></a>
              <a href="#" style={{ color: 'var(--text-muted)' }}><Shield size={20} /></a>
              <a href="#" style={{ color: 'var(--text-muted)' }}><Star size={20} /></a>
            </div>
          </div>
        </div>
        
        <div style={{ maxWidth: '1100px', margin: '60px auto 0', paddingTop: '30px', borderTop: '1px solid rgba(212, 175, 55, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>© 2026 Eclipse Theory AI. Built for the future of learning.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '12px', fontWeight: '800' }}>SaaS VERSION 2.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
