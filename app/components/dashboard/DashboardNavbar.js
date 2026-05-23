"use client";

import { Zap, History, Key, LogOut } from "lucide-react";
import Link from "next/link";

export default function DashboardNavbar({ 
  user, 
  userData, 
  historyCount, 
  apiKeyCount, 
  keyMode, 
  onToggleHistory, 
  onToggleKeys, 
  onLogout 
}) {
  const credits = userData?.credits_remaining ?? 0;
  const isPremium = userData?.plan === 'premium';
  const isAdmin = userData?.is_admin === true;

  return (
    <nav>
      <div className="nav-inner">
        <div className="logo">
          <div className="logo-icon">
            <Zap className="text-[#d4af37] w-5 h-5" />
          </div>
          Eclipse Theory
        </div>
        <div className="nav-right">
          {userData && (
            <div className="flex items-center gap-4 mr-4 border-r border-white/10 pr-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Credits</span>
                <span className="text-sm font-bold text-[#d4af37]">{isPremium ? '∞' : credits}</span>
              </div>
              {isPremium && (
                <span className="px-2 py-0.5 bg-[#d4af37] text-black text-[10px] font-black uppercase rounded-md shadow-[0_0_10px_rgba(212,175,55,0.3)]">Pro</span>
              )}
            </div>
          )}

          {isAdmin && (
            <Link href="/dashboard/admin" className="api-key-btn" style={{ borderColor: '#ef444466' }}>
              Admin
            </Link>
          )}
          
          <button className={`api-key-btn ${historyCount > 0 ? "saved" : ""}`} onClick={onToggleHistory}>
            <History className="w-4 h-4" /> {historyCount > 0 ? `${historyCount} Doc${historyCount > 1 ? "s" : ""}` : "History"}
          </button>
          
          <button className={`api-key-btn ${apiKeyCount > 0 ? "saved" : ""}`} onClick={onToggleKeys}>
            <Key className="w-4 h-4" /> {apiKeyCount > 0 ? `${apiKeyCount} Key${apiKeyCount > 1 ? "s" : ""}` : "API Keys"}
          </button>

          {keyMode && keyMode !== 'none' && (
            <span className="nav-tag" style={{ 
              background: keyMode.includes('optimal') ? "rgba(34, 197, 94, 0.08)" : "rgba(59, 130, 246, 0.08)", 
              borderColor: keyMode.includes('optimal') ? "rgba(34, 197, 94, 0.2)" : "rgba(59, 130, 246, 0.2)", 
              color: keyMode.includes('optimal') ? "#16a34a" : "#2563eb" 
            }}>
              {keyMode.includes('optimal') ? 'Optimal' : 'Fast Mode'}
            </span>
          )}
          
          <button className="api-key-btn" onClick={onLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
