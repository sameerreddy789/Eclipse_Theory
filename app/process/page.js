"use client";

import Link from "next/link";
import { Zap, ArrowLeft, Cpu, Network, Layers, Sparkles, BookOpen, Rocket } from "lucide-react";
import "../globals.css";

export default function ProcessPage() {
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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 24px 80px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--border)', borderRadius: '99px', marginBottom: '24px' }}>
          <Cpu size={14} color="var(--accent)" />
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px' }}>AI ORCHESTRATION PIPELINE</span>
        </div>
        
        <h1 style={{ fontSize: '42px', fontWeight: '900', color: 'var(--accent)', marginBottom: '16px' }}>The Process</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '60px' }}>How Eclipse Theory transforms raw data into structured knowledge.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
          {[
            { 
              icon: Network, 
              title: "1. Multi-Stage Ingestion", 
              desc: "The system accepts PDF, DOCX, and images. Our OCR engine performs deep-pixel analysis to extract text from even low-quality hand-written scans." 
            },
            { 
              icon: Layers, 
              title: "2. Vector Synthesis", 
              desc: "Extracted text is chunked and embedded into a high-dimensional vector space. This allows our AI to understand 'context' rather than just matching keywords." 
            },
            { 
              icon: Sparkles, 
              title: "3. Agentic Refinement", 
              desc: "Two distinct AI agents collaborate: one for logical analysis (Gemini) and one for creative synthesis (Llama 3.3). They cross-reference data to ensure maximum accuracy." 
            },
            { 
              icon: Rocket, 
              title: "4. Structured Output", 
              desc: "The final intelligence report is formatted into Markdown, Notion blocks, and Anki flashcards. Ready for immediate deployment to your learning environment." 
            }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
              <div style={{ padding: '15px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '15px', border: '1px solid var(--border)' }}>
                <item.icon size={24} color="var(--accent)" />
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text)', marginBottom: '12px' }}>{item.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '15px' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '12px' }}>
        © 2026 ECLIPSE THEORY AI · TECHNICAL ARCHITECTURE
      </footer>
    </div>
  );
}
