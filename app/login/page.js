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
  const { login } = useAuth();
  const router = useRouter();

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
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '4px' }}>Password</label>
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
