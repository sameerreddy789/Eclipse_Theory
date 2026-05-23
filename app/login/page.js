"use client";

import { useState } from "react";
import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import "../globals.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    try {
      await resetPassword(email);
      setResetEmailSent(true);
      setError("");
    } catch (err) {
      setError("Failed to send reset email. Check your email address.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <div className="logo-icon">
              <Zap className="text-[#d4af37] w-5 h-5" />
            </div>
            <span style={{ fontWeight: '800', color: 'var(--text)' }}>ECLIPSE THEORY</span>
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Continue your learning journey with AI.</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {resetEmailSent && (
          <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
            ✓ Password reset email sent! Check your inbox.
          </div>
        )}

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="btn-test-key"
          style={{ width: '100%', padding: '12px', borderRadius: '8px', color: 'var(--text)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', background: 'var(--bg-subtle)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h5.14c-.22 1.2-.88 2.21-1.83 2.85v2.39h2.96c1.74-1.6 2.73-3.96 2.73-6.72c0-.44-.04-.88-.1-1.25zM12.18 21c2.43 0 4.47-.8 5.96-2.18l-2.96-2.3c-.83.56-1.89.88-3 .88c-2.3 0-4.25-1.55-4.95-3.66H4.17v2.33c1.47 2.91 4.51 4.93 8.01 4.93zM7.23 13.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74V7.93H4.17c-.62 1.23-.97 2.61-.97 4.07s.35 2.84.97 4.07l3.06-2.33zm4.95-8.88c1.32 0 2.5.45 3.44 1.35l2.58-2.58C16.65 2.19 14.61 1.5 12.18 1.5c-3.5 0-6.54 2.02-8.01 4.93l3.06 2.33c.7-2.11 2.65-3.66 4.95-3.66z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--text-dim)', fontSize: '11px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          OR
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>Email</label>
            <input
              type="email"
              required
              className="bg-input"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)' }}>Password</label>
              <button type="button" onClick={handleResetPassword} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Forgot?</button>
            </div>
            <input
              type="password"
              required
              className="bg-input"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-save-key"
            style={{ width: '100%', padding: '14px', fontSize: '14px', marginTop: '10px' }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-dim)' }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: '700', textDecoration: 'none' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
