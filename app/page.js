"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import "./globals.css";
import { callGemini, buildTopicPrompt, buildModulePrompt, buildGlossaryPrompt } from "./lib/gemini";
import { slugify, assembleMarkdown } from "./lib/markdown";
import { processFiles, getFileIcon, formatFileSize } from "./lib/files";

function XIcon() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
}
function PlusIcon({ size = 12 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
}
function KeyIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>);
}
function UploadIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>);
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
    return [{ id: mId, name: "", topics: [{ id: tId, name: "" }], files: [] }];
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
    setKeySaved(true); setShowKeyInput(false); showToast("API key saved");
  };
  const clearApiKey = () => {
    localStorage.removeItem("eclipse-theory-api-key");
    setApiKey(""); setKeySaved(false); showToast("API key removed");
  };

  const addModule = () => {
    const mId = ++nextModuleId; const tId = ++nextTopicId;
    setModules((p) => [...p, { id: mId, name: "", topics: [{ id: tId, name: "" }], files: [] }]);
  };
  const removeModule = (mId) => setModules((p) => p.filter((m) => m.id !== mId));
  const updateModuleName = (mId, name) => setModules((p) => p.map((m) => m.id === mId ? { ...m, name } : m));
  const addTopic = (mId) => {
    const tId = ++nextTopicId;
    setModules((p) => p.map((m) => m.id === mId ? { ...m, topics: [...m.topics, { id: tId, name: "" }] } : m));
  };
  const removeTopic = (mId, tId) => setModules((p) => p.map((m) => m.id === mId ? { ...m, topics: m.topics.filter((t) => t.id !== tId) } : m));
  const updateTopicName = (mId, tId, name) => setModules((p) => p.map((m) => m.id === mId ? { ...m, topics: m.topics.map((t) => t.id === tId ? { ...t, name } : t) } : m));

  const addFiles = (mId, newFiles) => {
    setModules((p) => p.map((m) => m.id === mId ? { ...m, files: [...m.files, ...Array.from(newFiles)] } : m));
  };
  const removeFile = (mId, fileIdx) => {
    setModules((p) => p.map((m) => m.id === mId ? { ...m, files: m.files.filter((_, i) => i !== fileIdx) } : m));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = apiKey.trim();
    if (!key) { setShowKeyInput(true); showToast("Please add your Gemini API key first"); return; }
    if (!courseName.trim()) { showToast("Please enter a course name"); return; }

    const validModules = modules
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name.trim(),
        topics: m.topics.filter((t) => t.name.trim()).map((t) => t.name.trim()),
        files: m.files || [],
      }))
      .filter((m) => m.topics.length > 0);

    if (!validModules.length) { showToast("Add at least one module with topics"); return; }

    const totalTopics = validModules.reduce((s, m) => s + m.topics.length, 0);
    const totalFiles = validModules.reduce((s, m) => s + m.files.length, 0);
    setLoading(true); setOutput("");

    try {
      // Phase 0: Process uploaded files per module
      const moduleContexts = [];
      if (totalFiles > 0) {
        setProgress(`Processing ${totalFiles} uploaded file${totalFiles > 1 ? "s" : ""}...`);
      }
      for (const m of validModules) {
        if (m.files.length > 0) {
          const processed = await processFiles(m.files);
          moduleContexts.push(processed);
        } else {
          moduleContexts.push({ text: "", images: [] });
        }
      }

      // Phase 1: Module metadata
      setProgress(`Generating module overviews (${validModules.length})...`);
      const moduleMetas = await Promise.all(
        validModules.map((m, mi) =>
          callGemini(key, buildModulePrompt(m.name, m.topics, courseName.trim(), moduleContexts[mi].text), moduleContexts[mi].images)
            .then((r) => r || { overview: "", objectives: [], estimatedHours: 0, difficulty: "Medium", prerequisites: "None" })
        )
      );

      // Phase 2: Topics in batches of 3
      const topicDataMap = {};
      let completed = 0;
      const BATCH_SIZE = 3;
      const allTopicJobs = validModules.flatMap((m, mi) =>
        m.topics.map((t, ti) => ({ mi, ti, topicName: t, moduleName: m.name }))
      );

      for (let i = 0; i < allTopicJobs.length; i += BATCH_SIZE) {
        const batch = allTopicJobs.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map((job) => {
            const ctx = moduleContexts[job.mi];
            return callGemini(
              key,
              buildTopicPrompt(job.topicName, job.moduleName, courseName.trim(), depth, ctx.text),
              ctx.images
            );
          })
        );
        batch.forEach((job, idx) => { topicDataMap[`${job.mi}-${job.ti}`] = results[idx]; });
        completed += batch.length;
        setProgress(`Generating topics... ${completed}/${totalTopics}`);
        if (i + BATCH_SIZE < allTopicJobs.length) await new Promise((r) => setTimeout(r, 500));
      }

      // Phase 3: Glossary
      setProgress("Generating glossary...");
      const allTopicNames = validModules.flatMap((m) => m.topics);
      const glossaryData = await callGemini(key, buildGlossaryPrompt(courseName.trim(), allTopicNames))
        .then((r) => r || { terms: [] });

      // Phase 4: Assemble
      setProgress("Assembling document...");
      const md = assembleMarkdown({ courseName: courseName.trim(), depth, modules: validModules, moduleMetas, topicDataMap, glossaryData });
      setOutput(md);
      showToast("Document generated successfully");
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Generation failed");
    } finally {
      setLoading(false); setProgress("");
    }
  };

  const copyOutput = async () => { await navigator.clipboard.writeText(output); showToast("Copied to clipboard"); };
  const downloadMd = () => {
    const fn = slugify(courseName || "document") + "-master-learning-doc.md";
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([output], { type: "text/markdown" }));
    a.download = fn; a.click(); URL.revokeObjectURL(a.href); showToast("Downloaded " + fn);
  };

  const downloadPdf = async () => {
    setProgress("Generating PDF...");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth(), pageH = doc.internal.pageSize.getHeight();
      const mL = 18, mR = 18, mT = 22, mB = 20, cW = pageW - mL - mR;
      let y = mT;
      const check = (n = 10) => { if (y + n > pageH - mB) { doc.addPage(); y = mT; } };

      for (const line of output.split("\n")) {
        const t = line.trimEnd();
        if (t.startsWith("# 📘") || t.startsWith("# 🧩") || t.startsWith("# 📚")) {
          check(20); doc.setFont("helvetica", "bold").setFontSize(16).setTextColor(23, 23, 23);
          const sp = doc.splitTextToSize(t.replace(/^#+\s*/, "").replace(/[📘🧩📚📑🔹📖🖼️💡🔑🎯✅❌🔗📝📋🏋️]/g, "").trim(), cW);
          check(sp.length * 7); doc.text(sp, mL, y); y += sp.length * 7 + 4;
        } else if (t.startsWith("## ")) {
          check(16); doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(23, 23, 23);
          const sp = doc.splitTextToSize(t.replace(/^#+\s*/, "").replace(/[📘🧩📚📑🔹📖🖼️💡🔑🎯✅❌🔗📝📋🏋️]/g, "").trim(), cW);
          check(sp.length * 6); doc.text(sp, mL, y); y += sp.length * 6 + 3;
        } else if (t.startsWith("### ") || t.startsWith("#### ")) {
          check(12); doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(64, 64, 64);
          const sp = doc.splitTextToSize(t.replace(/^#+\s*/, "").replace(/[📘🧩📚📑🔹📖🖼️💡🔑🎯✅❌🔗📝📋🏋️🔸]/g, "").trim(), cW);
          check(sp.length * 5); doc.text(sp, mL, y); y += sp.length * 5 + 2;
        } else if (t.startsWith("---")) {
          check(6); doc.setDrawColor(229, 229, 229).setLineWidth(0.3); doc.line(mL, y, pageW - mR, y); y += 4;
        } else if (t.startsWith("> ")) {
          check(10); doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(82, 82, 82);
          const sp = doc.splitTextToSize(t.replace(/^>\s*/, "").replace(/\*\*/g, ""), cW - 6);
          check(sp.length * 4.5); doc.setFillColor(250, 250, 250); doc.rect(mL, y - 3, cW, sp.length * 4.5 + 4, "F");
          doc.text(sp, mL + 3, y); y += sp.length * 4.5 + 3;
        } else if (t.startsWith("| ") && t.includes("|")) {
          if (t.match(/^\|[\s-|]+\|$/)) continue;
          check(8); doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(64, 64, 64);
          const sp = doc.splitTextToSize(t.split("|").filter(Boolean).map((c) => c.trim()).join("  |  "), cW);
          check(sp.length * 4); doc.text(sp, mL, y); y += sp.length * 4 + 1;
        } else if (t.startsWith("```")) { continue;
        } else if (t.match(/^\d+\.\s/) || t.startsWith("- ")) {
          check(8); doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(40, 40, 40);
          const sp = doc.splitTextToSize(t.replace(/\*\*/g, "").replace(/[❌✅]/g, "").trim(), cW - 6);
          check(sp.length * 4.5); doc.text(sp, mL + 4, y); y += sp.length * 4.5 + 1;
        } else if (t.length > 0) {
          check(8); doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(40, 40, 40);
          const sp = doc.splitTextToSize(t.replace(/\*\*/g, "").replace(/_/g, ""), cW);
          check(sp.length * 4.5); doc.text(sp, mL, y); y += sp.length * 4.5 + 1;
        } else { y += 2; }
      }
      doc.save(slugify(courseName || "document") + "-master-learning-doc.pdf");
      showToast("PDF downloaded");
    } catch (err) { console.error(err); showToast("PDF generation failed"); }
    finally { setProgress(""); }
  };

  return (
    <>
      <nav>
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </div>
            Eclipse Theory
          </div>
          <div className="nav-right">
            {keySaved && !showKeyInput ? (
              <button className="api-key-btn saved" onClick={() => setShowKeyInput(true)}><KeyIcon /> API Key ✓</button>
            ) : (
              <button className="api-key-btn" onClick={() => setShowKeyInput(!showKeyInput)}><KeyIcon /> {showKeyInput ? "Close" : "API Key"}</button>
            )}
          </div>
        </div>
        {showKeyInput && (
          <div className="api-key-panel">
            <div className="api-key-panel-inner">
              <label htmlFor="apiKeyInput">Gemini API Key <span className="hint">— stored locally in your browser</span></label>
              <div className="api-key-row">
                <input type="password" id="apiKeyInput" placeholder="AIzaSy..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
                <button className="btn-save-key" onClick={saveApiKey}>Save</button>
                {keySaved && <button className="btn-clear-key" onClick={clearApiKey}>Clear</button>}
              </div>
              <p className="api-key-hint">Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com/apikey</a></p>
            </div>
          </div>
        )}
      </nav>

      <section className="hero">
        <h1>Generate <span className="highlight">Master Learning</span> Documents</h1>
        <p>Input your modules and topics, upload class notes — AI generates a complete study document from your material.</p>
        <div className="hero-pills">
          <span className="pill"><span className="pill-dot" /> AI-powered</span>
          <span className="pill"><span className="pill-dot" /> Upload notes</span>
          <span className="pill"><span className="pill-dot" /> PDF export</span>
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
              <label>Modules & Topics <span className="required">*</span><span className="hint">Add modules, topics, and optionally upload class notes per module</span></label>
              <div className="modules-wrap">
                {modules.length === 0 && <div className="empty-state">No modules yet. Click below to add one.</div>}
                {modules.map((mod, mi) => (
                  <div className="module-block" key={mod.id}>
                    <div className="module-head">
                      <div className="module-head-left">
                        <span className="module-num">{mi + 1}</span>
                        <input type="text" placeholder="Module name..." aria-label="Module name" value={mod.name} onChange={(e) => updateModuleName(mod.id, e.target.value)} />
                      </div>
                      <button type="button" className="btn-remove-module" onClick={() => removeModule(mod.id)}><XIcon /> Remove</button>
                    </div>
                    <div className="module-body">
                      <div className="topics-list">
                        {mod.topics.map((topic, ti) => (
                          <div className="topic-row" key={topic.id}>
                            <span className="topic-num">{mi + 1}.{ti + 1}</span>
                            <input type="text" placeholder="Topic name..." aria-label="Topic name" value={topic.name} onChange={(e) => updateTopicName(mod.id, topic.id, e.target.value)} />
                            <button type="button" className="btn-remove" onClick={() => removeTopic(mod.id, topic.id)}><XIcon /></button>
                          </div>
                        ))}
                      </div>
                      <div className="module-actions">
                        <button type="button" className="btn-add" onClick={() => addTopic(mod.id)}><PlusIcon /> Add Topic</button>
                        <label className="btn-upload" aria-label="Upload class notes">
                          <UploadIcon /> Upload Notes
                          <input
                            type="file"
                            multiple
                            accept="*/*"
                            style={{ display: "none" }}
                            onChange={(e) => { if (e.target.files && e.target.files.length > 0) addFiles(mod.id, e.target.files); e.target.value = ""; }}
                          />
                        </label>
                      </div>
                      {mod.files.length > 0 && (
                        <div className="file-list">
                          {mod.files.map((file, fi) => (
                            <div className="file-chip" key={fi}>
                              <span className="file-type-badge">{getFileIcon(file)}</span>
                              <span className="file-name">{file.name}</span>
                              <span className="file-size">{formatFileSize(file.size)}</span>
                              <button type="button" className="file-remove" onClick={() => removeFile(mod.id, fi)} aria-label={`Remove ${file.name}`}><XIcon /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <button type="button" className="btn-add" onClick={addModule}><PlusIcon /> Add Module</button>
              </div>
            </div>
            <button type="submit" className="btn-generate" disabled={loading}>
              {loading ? <><span className="spinner" /> {progress || "Generating..."}</> : "Generate Document"}
            </button>
          </form>
        </div>
      </section>

      {output && (
        <section className="output-section visible" ref={outputRef}>
          <div className="output-card">
            <div className="output-bar">
              <h2>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
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
