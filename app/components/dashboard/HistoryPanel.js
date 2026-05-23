"use client";

import { History, Trash2 } from "lucide-react";
import { formatHistoryDate, formatHistorySize } from "../../lib/storage/history";

export default function HistoryPanel({ 
  history, 
  historyStats, 
  onLoadItem, 
  onDeleteItem, 
  onClearAll 
}) {
  return (
    <div className="api-key-panel">
      <div className="api-key-panel-inner">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label>Document History <span className="hint">— {historyStats.totalDocuments} docs</span></label>
          {history.length > 0 && (
            <button onClick={onClearAll} className="btn-remove" style={{ fontSize: 10 }}>Clear All</button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)" }}>
            <History size={24} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p style={{ fontSize: 12 }}>No documents yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => onLoadItem(item)}
                className="file-chip"
                style={{ display: 'block', padding: 12, cursor: 'pointer' }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{item.courseName}</span>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} style={{ background: 'none', border: 'none', color: '#ef4444' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatHistoryDate(item.timestamp)}</span>
                  <span>{formatHistorySize(item.output)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
