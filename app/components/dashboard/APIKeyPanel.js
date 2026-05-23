"use client";

import { Key, X, RefreshCw } from "lucide-react";
import { PROVIDER_LIST, testApiKey } from "../../lib/ai/gemini";
import { useState } from "react";

export default function APIKeyPanel({ 
  apiKeys, 
  onAddKey, 
  onRemoveKey, 
  keyMode, 
  cacheStats, 
  onClearCache, 
  onUpdateCacheStats,
  showToast
}) {
  const [newProvider, setNewProvider] = useState("gemini");
  const [newKey, setNewKey] = useState("");
  const [testingKey, setTestingKey] = useState(false);

  const handleTest = async () => {
    if (!newKey.trim()) return;
    setTestingKey(true);
    showToast("Testing API key...");
    const result = await testApiKey(newProvider, newKey.trim());
    setTestingKey(false);
    showToast(result.success ? `✓ ${result.message}` : `✗ ${result.error}`);
  };

  const handleAdd = () => {
    onAddKey(newProvider, newKey);
    setNewKey("");
  };

  return (
    <div className="api-key-panel">
      <div className="api-key-panel-inner">
        <label>Add API Key <span className="hint">— supports multiple free providers</span></label>
        <div className="api-key-row">
          <select value={newProvider} onChange={(e) => setNewProvider(e.target.value)}>
            {PROVIDER_LIST.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input 
            type="password" 
            placeholder={PROVIDER_LIST.find((p) => p.id === newProvider)?.placeholder || "API key..."} 
            value={newKey} 
            onChange={(e) => setNewKey(e.target.value)} 
          />
          <button className="btn-test-key" onClick={handleTest} disabled={testingKey || !newKey.trim()}>
            {testingKey ? "..." : "Test"}
          </button>
          <button className="btn-save-key" onClick={handleAdd}>Add</button>
        </div>
        
        {keyMode !== "none" && (
          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}>
            <strong style={{ color: "var(--accent)" }}>System Status: {keyMode.toUpperCase()}</strong>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
          {apiKeys.map((k, i) => (
            <div key={i} className="file-chip" style={{ fontSize: 11 }}>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{k.providerId}</span>
              <span>...{k.key.slice(-4)}</span>
              <button onClick={() => onRemoveKey(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px' }}>×</button>
            </div>
          ))}
        </div>

        {cacheStats.totalSizeMB > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Cache: {cacheStats.totalSizeMB} MB</span>
              <button onClick={onClearCache} className="btn-remove" style={{ fontSize: 10 }}>Clear Cache</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
