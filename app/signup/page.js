"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, ArrowRight, Loader2, UserPlus } from "lucide-react";
import "../globals.css";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [referral, setReferral] = useState(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferral(ref);
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(referral);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Google signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, referral);
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to create account. Email might already be in use.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ background: '#050502' }}>
      <div className="auth-card" style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="auth-header">
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div className="logo-icon" style={{ background: 'var(--accent)' }}>
              <Zap className="text-black w-5 h-5" />
            </div>
            <span style={{ fontWeight: '900', color: 'var(--accent)', letterSpacing: '-0.5px' }}>ECLIPSE THEORY</span>
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text)' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Start generating master study documents for free.</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(220, 38, 38, 0.1)', color: '#FF4444', border: '1px solid #FF4444', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: '600' }}>
            {error}
          </div>
        )}

        {referral && (
          <div style={{ padding: '8px 12px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid var(--accent)', borderRadius: '8px', fontSize: '12px', color: 'var(--accent)', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={14} /> REFERRAL APPLIED: {referral}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="btn-test-key"
          style={{ width: '100%', padding: '14px', borderRadius: '10px', color: 'var(--accent)', border: '1px solid var(--accent)', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', background: 'transparent' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.14c-.22 1.2-.88 2.21-1.83 2.85v2.39h2.96c1.74-1.6 2.73-3.96 2.73-6.72c0-.44-.04-.88-.1-1.25zM12.18 21c2.43 0 4.47-.8 5.96-2.18l-2.96-2.3c-.83.56-1.89.88-3 .88c-2.3 0-4.25-1.55-4.95-3.66H4.17v2.33c1.47 2.91 4.51 4.93 8.01 4.93zM7.23 13.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74V7.93H4.17c-.62 1.23-.97 2.61-.97 4.07s.35 2.84.97 4.07l3.06-2.33zm4.95-8.88c1.32 0 2.5.45 3.44 1.35l2.58-2.58C16.65 2.19 14.61 1.5 12.18 1.5c-3.5 0-6.54 2.02-8.01 4.93l3.06 2.33c.7-2.11 2.65-3.66 4.95-3.66z"/></svg>
          CONTINUE WITH GOOGLE
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '800' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          OR
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '1px', display: 'block' }}>Email</label>
            <input
              type="email"
              required
              className="bg-input"
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-input)', outline: 'none' }}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '1px', display: 'block' }}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="bg-input"
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--bg-input)', outline: 'none' }}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-save-key"
            style={{ width: '100%', padding: '16px', fontSize: '15px', marginTop: '10px', background: 'var(--accent)', color: '#000', fontWeight: '900', borderRadius: '10px', boxShadow: '0 4px 15px rgba(212, 175, 55, 0.2)' }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "CREATE ACCOUNT"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-dim)', fontWeight: '500' }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: '800', textDecoration: 'none' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
