"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import "./globals.css";

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PlusIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

let nextModuleId = 0;
let nextTopicId = 0;

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [depth, setDepth] = useState("detailed");
  const [modules, setModules] = useState(() => {
    const mId = ++nextModuleId;
    const tId = ++nextTopicId;
    return [{ id: mId, name: "", topics: [{ id: tId, name: "" }] }];
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState("");
  const outputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("eclipse-theory-api-key");
    if (saved) { setApiKey(saved); setKeySaved(true); }
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const saveApiKey = () => {
    if (!apiKey.trim()) { showToast("Please enter an API key"); return; }
    localStorage.setItem("eclipse-theory-api-key", apiKey.trim());
    setKeySaved(true);
    setShowKeyInput(false);
    showToast("API key saved");
  };

  const clearApiKey = () => {
    localStorage.removeItem("eclipse-theory-api-key");
    setApiKey("");
    setKeySaved(false);
    showToast("API key removed");
  };

  const addModule = () => {
    const mId = ++nextModuleId;
    const tId = ++nextTopicId;
    setModules((prev) => [...prev, { id: mId, name: "", topics: [{ id: tId, name: "" }] }]);
  };

  const removeModule = (mId) => setModules((prev) => prev.filter((m) => m.id !== mId));
  const updateModuleName = (mId, name) => setModules((prev) => prev.map((m) => (m.id === mId ? { ...m, name } : m)));

  const addTopic = (mId) => {
    const tId = ++nextTopicId;
    setModules((prev) => prev.map((m) => m.id === mId ? { ...m, topics: [...m.topics, { id: tId, name: "" }] } : m));
  };

  const removeTopic = (mId, tId) => setModules((prev) => prev.map((m) => m.id === mId ? { ...m, topics: m.topics.filter((t) => t.id !== tId) } : m));
  const updateTopicName = (mId, tId, name) => setModules((prev) => prev.map((m) => m.id === mId ? { ...m, topics: m.topics.map((t) => (t.id === tId ? { ...t, name } : t)) } : m));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) { setShowKeyInput(true); showToast("Please add your Gemini API key first"); return; }
    if (!courseName.trim()) { showToast("Please enter a course name"); return; }

    const validModules = modules
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name.trim(), topics: m.topics.filter((t) => t.name.trim()).map((t) => t.name.trim()) }))
      .filter((m) => m.topics.length > 0);

    if (!validModules.length) { showToast("Add at least one module with topics"); return; }

    const totalTopics = validModules.reduce((s, m) => s + m.topics.length, 0);
    setLoading(true);
    setOutput("");
    setProgress(`Generating content for ${totalTopics} topic${totalTopics > 1 ? "s" : ""} via Gemini AI...`);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseName: courseName.trim(), depth, modules: validModules, apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Generation failed"); return; }
      setOutput(data.markdown);
      showToast("Document generated successfully");
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      showToast("Network error — please try again");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    showToast("Copied to clipboard");
  };

  const downloadMd = () => {
    const filename = slugify(courseName || "document") + "-master-learning-doc.md";
    const blob = new Blob([output], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Downloaded " + filename);
  };

  const downloadPdf = async () => {
    setProgress("Generating PDF...");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginL = 18;
      const marginR = 18;
      const marginTop = 22;
      const marginBot = 20;
      const contentW = pageW - marginL - marginR;
      let y = marginTop;

      const checkPage = (needed = 10) => {
        if (y + needed > pageH - marginBot) {
          doc.addPage();
          y = marginTop;
          return true;
        }
        return false;
      };

      const lines = output.split("\n");

      for (const line of lines) {
        const trimmed = line.trimEnd();

        if (trimmed.startsWith("# 📘") || trimmed.startsWith("# 🧩") || trimmed.startsWith("# 📚")) {
          checkPage(20);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(23, 23, 23);
          const text = trimmed.replace(/^#+\s*/, "").replace(/[📘🧩📚📑🔹📖🖼️💡🔑🎯✅❌🔗📝📋🏋️]/g, "").trim();
          const split = doc.splitTextToSize(text, contentW);
          checkPage(split.length * 7);
          doc.text(split, marginL, y);
          y += split.length * 7 + 4;
        } else if (trimmed.startsWith("## ")) {
          checkPage(16);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          doc.setTextColor(23, 23, 23);
          const text = trimmed.replace(/^#+\s*/, "").replace(/[📘🧩📚📑🔹📖🖼️💡🔑🎯✅❌🔗📝📋🏋️]/g, "").trim();
          const split = doc.splitTextToSize(text, contentW);
          checkPage(split.length * 6);
          doc.text(split, marginL, y);
          y += split.length * 6 + 3;
        } else if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
          checkPage(12);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(64, 64, 64);
          const text = trimmed.replace(/^#+\s*/, "").replace(/[📘🧩📚📑🔹📖🖼️💡🔑🎯✅❌🔗📝📋🏋️🔸]/g, "").trim();
          const split = doc.splitTextToSize(text, contentW);
          checkPage(split.length * 5);
          doc.text(split, marginL, y);
          y += split.length * 5 + 2;
        } else if (trimmed.startsWith("---")) {
          checkPage(6);
          doc.setDrawColor(229, 229, 229);
          doc.setLineWidth(0.3);
          doc.line(marginL, y, pageW - marginR, y);
          y += 4;
        } else if (trimmed.startsWith("> ")) {
          checkPage(10);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9);
          doc.setTextColor(82, 82, 82);
          const text = trimmed.replace(/^>\s*/, "").replace(/\*\*/g, "");
          const split = doc.splitTextToSize(text, contentW - 6);
          checkPage(split.length * 4.5);
          doc.setFillColor(250, 250, 250);
          doc.rect(marginL, y - 3, contentW, split.length * 4.5 + 4, "F");
          doc.text(split, marginL + 3, y);
          y += split.length * 4.5 + 3;
        } else if (trimmed.startsWith("| ") && trimmed.includes("|")) {
          if (trimmed.match(/^\|[\s-|]+\|$/)) continue;
          checkPage(8);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(64, 64, 64);
          const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim());
          const text = cells.join("  |  ");
          const split = doc.splitTextToSize(text, contentW);
          checkPage(split.length * 4);
          doc.text(split, marginL, y);
          y += split.length * 4 + 1;
        } else if (trimmed.startsWith("```")) {
          checkPage(6);
          doc.setFont("courier", "normal");
          doc.setFontSize(8);
          doc.setTextColor(82, 82, 82);
          continue;
        } else if (trimmed.match(/^\d+\.\s/) || trimmed.startsWith("- ")) {
          checkPage(8);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(40, 40, 40);
          const text = trimmed.replace(/\*\*/g, "").replace(/[❌✅]/g, "").trim();
          const split = doc.splitTextToSize(text, contentW - 6);
          checkPage(split.length * 4.5);
          doc.text(split, marginL + 4, y);
          y += split.length * 4.5 + 1;
        } else if (trimmed.length > 0) {
          checkPage(8);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(40, 40, 40);
          const text = trimmed.replace(/\*\*/g, "").replace(/_/g, "");
          const split = doc.splitTextToSize(text, contentW);
          checkPage(split.length * 4.5);
          doc.text(split, marginL, y);
          y += split.length * 4.5 + 1;
        } else {
          y += 2;
        }
      }

      const filename = slugify(courseName || "document") + "-master-learning-doc.pdf";
      doc.save(filename);
      showToast("PDF downloaded");
    } catch (err) {
      console.error(err);
      showToast("PDF generation failed");
    } finally {
      setProgress("");
    }
  };

  return (
    <>
      <nav>
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            Eclipse Theory
          </div>
          <div className="nav-right">
            {keySaved && !showKeyInput ? (
              <button className="api-key-btn saved" onClick={() => setShowKeyInput(true)} aria-label="API key settings">
                <KeyIcon /> API Key ✓
              </button>
            ) : (
              <button className="api-key-btn" onClick={() => setShowKeyInput(!showKeyInput)} aria-label="Add API key">
                <KeyIcon /> {showKeyInput ? "Close" : "API Key"}
              </button>
            )}
          </div>
        </div>
        {showKeyInput && (
          <div className="api-key-panel">
            <div className="api-key-panel-inner">
              <label htmlFor="apiKeyInput">Gemini API Key <span className="hint">— stored locally in your browser</span></label>
              <div className="api-key-row">
                <input
                  type="password"
                  id="apiKeyInput"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  autoComplete="off"
                />
                <button className="btn-save-key" onClick={saveApiKey}>Save</button>
                {keySaved && <button className="btn-clear-key" onClick={clearApiKey}>Clear</button>}
              </div>
              <p className="api-key-hint">
                Get a free key at{" "}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
                  aistudio.google.com/apikey
                </a>
              </p>
            </div>
          </div>
        )}
      </nav>

      <section className="hero">
        <h1>Generate <span className="highlight">Master Learning</span> Documents</h1>
        <p>Input your modules and topics. AI generates a complete, structured study document — download as PDF.</p>
        <div className="hero-pills">
          <span className="pill"><span className="pill-dot" /> AI-powered content</span>
          <span className="pill"><span className="pill-dot" /> PDF export</span>
          <span className="pill"><span className="pill-dot" /> Gemini 2.0 Flash</span>
        </div>
      </section>

      <section className="form-section">
        <div className="card">
          <div className="card-header">
            <h2>Configure Document</h2>
            <span className="step-tag">Input</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="row">
              <div className="field">
                <label htmlFor="courseName">Course Name <span className="required">*</span></label>
                <input type="text" id="courseName" placeholder="e.g. Data Structures & Algorithms" value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="targetDepth">Detail Level</label>
                <select id="targetDepth" value={depth} onChange={(e) => setDepth(e.target.value)}>
                  <option value="brief">Brief — 300 words/topic</option>
                  <option value="detailed">Detailed — 500-800 words/topic</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Modules & Topics <span className="required">*</span><span className="hint">Add modules, then topics inside each</span></label>
              <div className="modules-wrap">
                {modules.length === 0 && <div className="empty-state">No modules yet. Click below to add one.</div>}
                {modules.map((mod, mi) => (
                  <div className="module-block" key={mod.id}>
                    <div className="module-head">
                      <div className="module-head-left">
                        <span className="module-num">{mi + 1}</span>
                        <input type="text" placeholder="Module name..." aria-label="Module name" value={mod.name} onChange={(e) => updateModuleName(mod.id, e.target.value)} />
                      </div>
                      <button type="button" className="btn-remove-module" aria-label="Remove module" onClick={() => removeModule(mod.id)}>
                        <XIcon /> Remove
                      </button>
                    </div>
                    <div className="module-body">
                      <div className="topics-list">
                        {mod.topics.map((topic, ti) => (
                          <div className="topic-row" key={topic.id}>
                            <span className="topic-num">{mi + 1}.{ti + 1}</span>
                            <input type="text" placeholder="Topic name..." aria-label="Topic name" value={topic.name} onChange={(e) => updateTopicName(mod.id, topic.id, e.target.value)} />
                            <button type="button" className="btn-remove" aria-label="Remove topic" onClick={() => removeTopic(mod.id, topic.id)}><XIcon /></button>
                          </div>
                        ))}
                      </div>
                      <div className="module-actions">
                        <button type="button" className="btn-add" onClick={() => addTopic(mod.id)} aria-label="Add topic"><PlusIcon /> Add Topic</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <button type="button" className="btn-add" onClick={addModule} aria-label="Add a new module"><PlusIcon /> Add Module</button>
              </div>
            </div>

            <button type="submit" className="btn-generate" disabled={loading}>
              {loading ? <><span className="spinner" /> {progress || "Generating..."}</> : "Generate Document"}
            </button>
          </form>
        </div>
      </section>

      {output && (
        <section className="output-section visible" ref={outputRef} aria-live="polite">
          <div className="output-card">
            <div className="output-bar">
              <h2>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Generated Document
              </h2>
              <div className="output-bar-actions">
                <button className="btn-ghost" onClick={copyOutput}>Copy</button>
                <button className="btn-ghost" onClick={downloadMd}>Download .md</button>
                <button className="btn-pdf" onClick={downloadPdf}>Download PDF</button>
              </div>
            </div>
            <div className="output-content">{output}</div>
          </div>
        </section>
      )}

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast}</div>
      <footer>Eclipse Theory — Built for learners who take notes seriously.</footer>
    </>
  );
}
