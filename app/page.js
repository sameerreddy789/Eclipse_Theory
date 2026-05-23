"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Shield, Rocket, Users, BookOpen, Star, ArrowRight, CheckCircle2, Mail, Linkedin, ChevronDown, Award, Send, MessageSquare } from "lucide-react";
import "./globals.css";
import { useAuth } from "./lib/auth";
import { db } from "./lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [feedback, setFeedback] = useState({ name: "", role: "", text: "", rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const ctaLink = user ? "/dashboard" : "/signup";
  const ctaLabel = user ? "GO TO DASHBOARD" : "GET STARTED";

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.text || !feedback.name) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "testimonials"), {
        ...feedback,
        timestamp: serverTimestamp(),
        approved: false // Admin can moderate later
      });
      setSubmitted(true);
      setFeedback({ name: "", role: "", text: "", rating: 5 });
    } catch (err) {
      console.error("Feedback failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

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
            <Link href="#pricing" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Pricing</Link>
            <Link href={ctaLink} className="btn-save-key" style={{ display: 'flex', alignItems: 'center', height: '32px', background: 'var(--accent)', color: '#000', fontWeight: '900', padding: '0 20px', borderRadius: '50px' }}>
              {loading ? "..." : ctaLabel}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" style={{ paddingTop: '140px', paddingBottom: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)', zIndex: -1 }}></div>
        <div className="hero">
          <h1 className="hero-title" style={{ textShadow: '0 0 30px rgba(212, 175, 55, 0.1)' }}>
            Master Any Subject <br />
            <span style={{ color: 'var(--accent)', filter: 'brightness(1.1)' }}>with AI Intelligence.</span>
          </h1>
          <p className="hero-subtitle" style={{ margin: '0 auto 40px', maxWidth: '600px' }}>
            Upload your documents, and our AI pipeline will generate exam-ready study notes, 
            semantic search summaries, and high-fidelity PDF content in seconds.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href={ctaLink} className="btn-save-key" style={{ padding: '14px 36px', fontSize: '16px', borderRadius: '50px', boxShadow: '0 10px 20px -5px rgba(212, 175, 55, 0.2)', background: 'var(--accent)', color: '#000', fontWeight: '900' }}>
              {loading ? "CHECKING ACCESS..." : user ? "OPEN DASHBOARD" : "START LEARNING FREE"}
            </Link>
            <Link href="#how-it-works" className="btn-test-key" style={{ padding: '14px 36px', fontSize: '16px', borderRadius: '50px', background: 'transparent', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: '700' }}>
              HOW IT WORKS
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
            { step: "03", title: "Master", desc: "Get master guides and instantly export to high-fidelity PDF or Markdown." }
          ].map((item, i) => (
            <div key={i} style={{ padding: '30px', background: 'var(--bg-subtle)', borderRadius: '20px', border: '1px solid var(--border)', position: 'relative' }}>
              <div style={{ fontSize: '40px', fontWeight: '900', color: 'rgba(212, 175, 55, 0.05)', position: 'absolute', top: '15px', right: '20px' }}>{item.step}</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)', marginBottom: '12px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compact Pricing Section - Forced Side-by-Side */}
      <section id="pricing" style={{ padding: '60px 24px', background: 'rgba(212, 175, 55, 0.01)', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', color: 'var(--accent)' }}>CHOOSE YOUR TIER</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Simple, transparent pricing for every student.</p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px', 
          maxWidth: '680px', 
          margin: '0 auto' 
        }}>
          {/* Standard Plan */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '24px', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--text-dim)' }}>Standard</h3>
            <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '16px', color: 'var(--text)' }}>₹0</div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '20px', fontSize: '12px', flex: 1 }}>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}><CheckCircle2 size={14} color="var(--accent)" /> 3 Initial Credits</li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}><CheckCircle2 size={14} color="var(--accent)" /> File limit is 3</li>
            </ul>
            <Link href="/signup" className="btn-test-key" style={{ display: 'block', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', borderColor: 'var(--accent)', color: 'var(--accent)' }}>START FREE</Link>
          </div>

          {/* Premium Plan */}
          <div style={{ background: 'var(--bg-elevated)', border: '2px solid var(--accent)', padding: '24px', borderRadius: '16px', position: 'relative', textAlign: 'center', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 20px -10px rgba(212, 175, 55, 0.2)' }}>
            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#000', padding: '2px 10px', borderRadius: '20px', fontSize: '8px', fontWeight: '900', letterSpacing: '0.5px' }}>BEST VALUE</div>
            <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: 'var(--accent)' }}>Premium</h3>
            <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '16px', color: 'var(--accent)' }}>₹49 <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '20px', fontSize: '12px', flex: 1 }}>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontWeight: '600' }}><CheckCircle2 size={14} color="var(--accent)" /> 10 Gens / Day</li>
              <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontWeight: '600' }}><CheckCircle2 size={14} color="var(--accent)" /> Unlimited uploads</li>
            </ul>
            <Link href="/signup" className="btn-save-key" style={{ display: 'block', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '900' }}>GO PRO</Link>
          </div>
        </div>
      </section>

      {/* Moving Testimonials Section */}
      <section style={{ padding: '100px 0 60px', background: 'rgba(212, 175, 55, 0.02)', borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
        <div className="hero" style={{ padding: '0 0 40px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--accent)', marginBottom: '16px' }}>THE ARCHITECT'S CHOICE</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Trusted by elite students and researchers worldwide.</p>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-350px * 10)); }
          }
          .testimonial-track {
            display: flex;
            width: calc(350px * 20);
            animation: scroll 60s linear infinite;
            gap: 20px;
            padding: 20px 0;
          }
          .testimonial-track:hover {
            animation-play-state: paused;
          }
        `}} />

        <div className="testimonial-track">
          {[
            { name: "Arjun Reddy", role: "Medical Student", text: "Turned 500 pages of anatomy notes into a 20-page master guide. A game changer." },
            { name: "Sarah J.", role: "Full-stack Dev", text: "The Mermaid diagram generation is scarily accurate. Worth every penny." },
            { name: "Dr. James Miller", role: "Researcher", text: "The semantic search is a paradigm shift for literature reviews." },
            { name: "Elena V.", role: "Law Student", text: "Legal case synthesis used to take me days. Now it's a matter of minutes." },
            { name: "Mark Thompson", role: "CS Student", text: "OCR is flawless even with my terrible handwriting. 10/10." },
            { name: "Aisha Khan", role: "Biology Major", text: "Finally an AI that doesn't hallucinate technical diagrams." },
            { name: "Prof. Robert Chen", role: "Educator", text: "I recommend this to all my students for structured exam prep." },
            { name: "Linda G.", role: "UX Designer", text: "The UI is clean and the gold theme feels truly premium." },
            { name: "Kevin S.", role: "Data Scientist", text: "Vector synthesis at its finest. The chunking logic is perfect." },
            { name: "Maria Garcia", role: "Philosophy Student", text: "It captures the essence of complex arguments beautifully." },
            // Loop Duplicates
            { name: "Arjun Reddy", role: "Medical Student", text: "Turned 500 pages of anatomy notes into a 20-page master guide. A game changer." },
            { name: "Sarah J.", role: "Full-stack Dev", text: "The Mermaid diagram generation is scarily accurate. Worth every penny." },
            { name: "Dr. James Miller", role: "Researcher", text: "The semantic search is a paradigm shift for literature reviews." },
            { name: "Elena V.", role: "Law Student", text: "Legal case synthesis used to take me days. Now it's a matter of minutes." },
            { name: "Mark Thompson", role: "CS Student", text: "OCR is flawless even with my terrible handwriting. 10/10." },
            { name: "Aisha Khan", role: "Biology Major", text: "Finally an AI that doesn't hallucinate technical diagrams." },
            { name: "Prof. Robert Chen", role: "Educator", text: "I recommend this to all my students for structured exam prep." },
            { name: "Linda G.", role: "UX Designer", text: "The UI is clean and the gold theme feels truly premium." },
            { name: "Kevin S.", role: "Data Scientist", text: "Vector synthesis at its finest. The chunking logic is perfect." },
            { name: "Maria Garcia", role: "Philosophy Student", text: "It captures the essence of complex arguments beautifully." }
          ].map((t, i) => (
            <div key={i} style={{ width: '330px', flexShrink: 0, padding: '30px', background: 'var(--bg-subtle)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: '16px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={12} fill="var(--accent)" color="var(--accent)" />)}
              </div>
              <p style={{ color: 'var(--text)', fontSize: '14px', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.6' }}>"{t.text}"</p>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent)' }}>{t.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Share Experience Form */}
      <section style={{ padding: '60px 24px 100px', background: 'rgba(212, 175, 55, 0.01)', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-subtle)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '30px' }}>
            <MessageSquare size={32} color="var(--accent)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent)', marginBottom: '8px' }}>RATE YOUR EXPERIENCE</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Help us refine the future of scholarly AI.</p>
          </div>

          {submitted ? (
            <div style={{ padding: '40px 0' }}>
              <CheckCircle2 size={48} color="var(--accent)" style={{ margin: '0 auto 20px' }} />
              <h3 style={{ color: 'var(--text)', fontWeight: '800' }}>THANK YOU!</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Your feedback has been sent to our architects.</p>
              <button onClick={() => setSubmitted(false)} style={{ marginTop: '24px', background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '8px 20px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Submit Another</button>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>Your Name</label>
                  <input 
                    type="text" required value={feedback.name} onChange={e => setFeedback({...feedback, name: e.target.value})}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', width: '100%', color: 'var(--text)' }}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>Your Role</label>
                  <input 
                    type="text" value={feedback.role} onChange={e => setFeedback({...feedback, role: e.target.value})}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', width: '100%', color: 'var(--text)' }}
                    placeholder="e.g. Student"
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>Rating</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setFeedback({...feedback, rating: star})} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Star size={24} fill={feedback.rating >= star ? "var(--accent)" : "none"} color="var(--accent)" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>Your Testimony</label>
                <textarea 
                  required value={feedback.text} onChange={e => setFeedback({...feedback, text: e.target.value})}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '12px', borderRadius: '10px', width: '100%', minHeight: '100px', color: 'var(--text)', resize: 'none' }}
                  placeholder="Tell the world how Eclipse Theory changed your learning..."
                />
              </div>
              <button 
                type="submit" disabled={submitting}
                style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {submitting ? "SUBMITTING..." : <>SHARE EXPERIENCE <Send size={16} /></>}
              </button>
            </form>
          )}
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
