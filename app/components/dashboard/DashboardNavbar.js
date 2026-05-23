"use client";

import { Zap, History, Key, LogOut } from "lucide-react";
import Link from "next/link";

export default function DashboardNavbar({ 
  user, 
  userData, 
  historyCount, 
  onToggleHistory, 
  onLogout 
}) {
  const credits = userData?.credits_remaining ?? 0;
  const isPremium = userData?.plan === 'premium';
  const isAdmin = userData?.is_admin === true;

  return (
    <nav>
      <div className="nav-inner">
        <div className="logo">
          <div className="logo-icon" style={{ background: 'var(--accent)' }}>
            <Zap className="text-black w-5 h-5" />
          </div>
          <span style={{ color: 'var(--accent)', fontWeight: '900', letterSpacing: '-0.5px' }}>ECLIPSE THEORY</span>
        </div>
        <div className="nav-right">
          {userData && (
            <div className="flex items-center gap-4 mr-4 border-r border-white/10 pr-4">
              <div className="flex flex-col items-end">
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>Credits</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>{isPremium ? '∞' : credits}</span>
              </div>
              {isPremium && (
                <span className="nav-tag" style={{ background: 'var(--accent)', color: '#000', border: 'none' }}>Pro</span>
              )}
            </div>
          )}

          {isAdmin && (
            <Link href="/dashboard/admin" className="api-key-btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              Admin
            </Link>
          )}
          
          <button className={`api-key-btn ${historyCount > 0 ? "saved" : ""}`} onClick={onToggleHistory}>
            <History className="w-4 h-4" /> {historyCount > 0 ? `${historyCount} Doc${historyCount > 1 ? "s" : ""}` : "History"}
          </button>
          
          <button className="api-key-btn" onClick={onLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
