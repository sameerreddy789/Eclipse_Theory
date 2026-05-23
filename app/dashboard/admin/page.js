"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { db } from "../../lib/firebase";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Users, BarChart3, AlertTriangle, ShieldCheck, Zap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import "../../globals.css";

export default function AdminDashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({ users: 0, generations: 0, events: 0 });
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !userData?.is_admin)) {
      router.push("/dashboard");
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This is a simplified admin view for MVP. 
        // In production, use Cloud Functions to aggregate these counts.
        const usersSnap = await getDocs(collection(db, "users"));
        const eventsSnap = await getDocs(query(collection(db, "events"), limit(100)));
        
        let totalGens = 0;
        const flagged = [];
        usersSnap.forEach(doc => {
          const data = doc.data();
          totalGens += (data.generations_total || 0);
          if (data.abuse_score > 50) flagged.push(data);
        });

        setStats({
          users: usersSnap.size,
          generations: totalGens,
          events: eventsSnap.size
        });
        setFlaggedUsers(flagged);
      } catch (err) {
        console.error("Admin fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.is_admin) fetchStats();
  }, [userData]);

  if (authLoading || loading) return <div className="auth-container"><Zap className="animate-spin" /></div>;

  return (
    <div className="landing-page" style={{ padding: '40px 24px' }}>
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="logo">
            <Link href="/dashboard" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeft size={16} /> ADMIN CORE
            </Link>
          </div>
          <div className="nav-right">
            <span className="nav-tag" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent)' }}>System Master</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '80px auto 0' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 40 }}>System Health Overview</h1>
        
        <div className="pricing-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 60 }}>
          <div className="pricing-card">
            <Users size={32} color="var(--accent)" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 40, fontWeight: 800 }}>{stats.users}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Total Registered Users</div>
          </div>
          <div className="pricing-card">
            <Zap size={32} color="#16a34a" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 40, fontWeight: 800 }}>{stats.generations}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Total Documents Generated</div>
          </div>
          <div className="pricing-card">
            <BarChart3 size={32} color="#2563eb" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 40, fontWeight: 800 }}>{stats.events}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>System Events (Last 100)</div>
          </div>
        </div>

        <section>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle color="#ef4444" size={20} /> Flagged for Abuse
          </h2>
          
          {flaggedUsers.length === 0 ? (
            <div className="pricing-card" style={{ padding: 40, color: 'var(--text-dim)' }}>
              No suspicious activity detected. All systems nominal.
            </div>
          ) : (
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 16 }}>User Email</th>
                    <th style={{ textAlign: 'left', padding: 16 }}>Abuse Score</th>
                    <th style={{ textAlign: 'left', padding: 16 }}>Gens</th>
                    <th style={{ textAlign: 'left', padding: 16 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedUsers.map((u, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: 16 }}>{u.email}</td>
                      <td style={{ padding: 16, color: '#ef4444', fontWeight: 700 }}>{u.abuse_score}</td>
                      <td style={{ padding: 16 }}>{u.generations_total}</td>
                      <td style={{ padding: 16 }}>
                        <button className="btn-remove" style={{ fontSize: 11, padding: '4px 8px' }}>Disable Access</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
