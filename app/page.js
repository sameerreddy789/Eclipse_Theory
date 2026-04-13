"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import "./globals.css";
import { callGemini, buildModulePrompt, buildGlossaryPrompt, PROVIDER_LIST, testApiKey } from "./lib/gemini";
import { slugify, assembleMarkdown } from "./lib/markdown";
import { processFiles, getFileIcon, formatFileSize } from "./lib/files";
import { chunkDocuments, findRelevantChunks } from "./lib/chunking";
import { generateTopicTwoStage, getKeyStats } from "./lib/twoStage";
import { 
  getCachedDocumentChunks, 
  cacheDocumentChunks, 
  getCachedAnalysisResult,
  cacheAnalysisResult,
  getCachedGeneratedDocument,
  cacheGeneratedDocument,
  getCacheStats,
  clearAllCaches,
  clearOldCaches,
} from "./lib/cache";

function XIcon() {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
}
function PlusIcon({ size = 12 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
}
function KeyIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>);
}
function UploadIcon({ size = 14 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>);
}

let nextModuleId = 0;
let nextTopicId = 0;

export default function Home() {
  const [apiKeys, setApiKeys] = useState([]); // [{providerId, key}]
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [newProvider, setNewProvider] = useState("gemini");
  const [newKey, setNewKey] = useState("");
  const [testingKey, setTestingKey] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [depth, setDepth] = useState("detailed");
  const [speedMode, setSpeedMode] = useState(false);
  const [globalFiles, setGlobalFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [modules, setModules] = useState(() => {
    const mId = ++nextModuleId;
    const tId = ++nextTopicId;
    return [{ id: mId, name: "", topics: [{ id: tId, name: "" }] }];
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState("");
  const [keyMode, setKeyMode] = useState("none");
  const [cacheStats, setCacheStats] = useState({ totalSizeMB: "0", counts: {} });
  const outputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("eclipse-theory-keys-v2");
    if (saved) {
      try { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setApiKeys(parsed); } catch {}
    }
    // Clear old caches on mount
    clearOldCaches(7);
    updateCacheStats();
  }, []);

  useEffect(() => {
    const stats = getKeyStats(apiKeys);
    setKeyMode(stats.mode);
  }, [apiKeys]);

  const updateCacheStats = () => {
    const stats = getCacheStats();
    setCacheStats(stats);
  };

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  const addApiKey = () => {
    if (!newKey.trim() || newKey.trim().length < 5) { showToast("Enter a valid API key"); return; }
    const updated = [...apiKeys, { providerId: newProvider, key: newKey.trim() }];
    setApiKeys(updated);
    localStorage.setItem("eclipse-theory-keys-v2", JSON.stringify(updated));
    setNewKey("");
    const prov = PROVIDER_LIST.find((p) => p.id === newProvider);
    showToast(`${prov?.name} key added (${updated.length} total)`);
  };

  const testKey = async () => {
    if (!newKey.trim() || newKey.trim().length < 5) { 
      showToast("Enter a valid API key first"); 
      return; 
    }
    
    setTestingKey(true);
    showToast("Testing API key...");
    
    const result = await testApiKey(newProvider, newKey.trim());
    
    setTestingKey(false);
    
    if (result.success) {
      showToast(`✓ ${result.message}`);
    } else {
      showToast(`✗ ${result.error}`);
    }
  };
  const removeApiKey = (idx) => {
    const updated = apiKeys.filter((_, i) => i !== idx);
    setApiKeys(updated);
    localStorage.setItem("eclipse-theory-keys-v2", JSON.stringify(updated));
    showToast("Key removed");
  };
  const keyIndexRef = useRef(0);
  const getNextKey = () => {
    if (apiKeys.length === 0) return null;
    const entry = apiKeys[keyIndexRef.current % apiKeys.length];
    keyIndexRef.current++;
    return entry;
  };

  // Module/topic CRUD
  const addModule = () => {
    const mId = ++nextModuleId; const tId = ++nextTopicId;
    setModules((p) => [...p, { id: mId, name: "", topics: [{ id: tId, name: "" }] }]);
  };
  const removeModule = (mId) => setModules((p) => p.filter((m) => m.id !== mId));
  const updateModuleName = (mId, name) => setModules((p) => p.map((m) => m.id === mId ? { ...m, name } : m));
  const addTopic = (mId) => {
    const tId = ++nextTopicId;
    setModules((p) => p.map((m) => m.id === mId ? { ...m, topics: [...m.topics, { id: tId, name: "" }] } : m));
  };
  const removeTopic = (mId, tId) => setModules((p) => p.map((m) => m.id === mId ? { ...m, topics: m.topics.filter((t) => t.id !== tId) } : m));
  const updateTopicName = (mId, tId, name) => setModules((p) => p.map((m) => m.id === mId ? { ...m, topics: m.topics.map((t) => t.id === tId ? { ...t, name } : t) } : m));

  // Global file management
  const handleGlobalFiles = (files) => {
    if (files && files.length > 0) {
      setGlobalFiles((prev) => [...prev, ...Array.from(files)]);
      showToast(`${files.length} file${files.length > 1 ? "s" : ""} added`);
    }
  };
  const removeGlobalFile = (idx) => setGlobalFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleGlobalFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (apiKeys.length === 0) { setShowKeyInput(true); showToast("Add at least one API key first"); return; }
    
    // Check key configuration
    const keyStats = getKeyStats(apiKeys);
    if (keyStats.mode === "none") {
      showToast("Add at least one API key (Gemini, OpenRouter, or Groq)");
      setShowKeyInput(true);
      return;
    }
    
    // Show mode info
    if (keyStats.optimal) {
      showToast("Two-stage mode: Gemini (analyze) + OpenRouter (write)");
    } else if (keyStats.mode === "gemini-only") {
      showToast("Single-stage mode: Gemini only (add OpenRouter for better quality)");
    } else if (keyStats.mode === "openrouter-only") {
      showToast("Single-stage mode: OpenRouter only (add Gemini for document analysis)");
    } else if (keyStats.mode === "groq-only") {
      showToast("Fast mode: Groq only (add others for better quality)");
    }
    
    keyIndexRef.current = 0;
    if (!courseName.trim()) { showToast("Please enter a course name"); return; }

    const validModules = modules
      .filter((m) => m.name.trim())
      .map((m) => ({ name: m.name.trim(), topics: m.topics.filter((t) => t.name.trim()).map((t) => t.name.trim()) }))
      .filter((m) => m.topics.length > 0);

    if (!validModules.length) { showToast("Add at least one module with topics"); return; }

    const totalTopics = validModules.reduce((s, m) => s + m.topics.length, 0);
    setLoading(true); setOutput("");

    try {
      // Phase 0: Process and chunk all global files (with caching)
      let documentChunks = [];
      let documentHashes = [];
      let globalImages = [];

      if (globalFiles.length > 0) {
        setProgress(`Processing ${globalFiles.length} uploaded file${globalFiles.length > 1 ? "s" : ""}...`);
        const { processedFiles, images } = await processFiles(globalFiles);
        globalImages = images;

        if (processedFiles.length > 0) {
          setProgress("Checking cache for processed documents...");
          
          // Try to get cached chunks for each file
          for (const file of globalFiles) {
            const cached = await getCachedDocumentChunks(file);
            if (cached) {
              documentChunks.push(...cached.chunks);
              documentHashes.push(cached.hash);
            } else {
              // Process and cache new file
              const fileData = processedFiles.find((pf) => pf.fileName === file.name);
              if (fileData) {
                const chunks = chunkDocuments([fileData]);
                const hash = await cacheDocumentChunks(file, chunks);
                documentChunks.push(...chunks);
                if (hash) documentHashes.push(hash);
              }
            }
          }
          
          const cachedCount = documentHashes.length;
          const totalCount = globalFiles.length;
          if (cachedCount > 0) {
            showToast(`Used cache for ${cachedCount}/${totalCount} files (${documentChunks.length} chunks)`);
          } else {
            showToast(`Processed ${processedFiles.length} files into ${documentChunks.length} searchable chunks`);
          }
          updateCacheStats();
        }
      }

      // Check if we can use cached full document
      if (documentHashes.length > 0) {
        setProgress("Checking for cached document...");
        const cachedDoc = await getCachedGeneratedDocument(courseName.trim(), validModules, documentHashes);
        if (cachedDoc) {
          setOutput(cachedDoc);
          showToast("Loaded from cache (instant!)");
          setLoading(false);
          setProgress("");
          setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
          return;
        }
      }

      // Phase 1: Module metadata (sequential to avoid rate limits)
      setProgress(`Generating module overviews (${validModules.length})...`);
      const analyzerKey = apiKeys.find((k) => k.providerId === "gemini") || apiKeys[0];
      const moduleMetas = [];
      
      for (let i = 0; i < validModules.length; i++) {
        const m = validModules[i];
        const relevantChunks = findRelevantChunks(documentChunks, m.name, 5);
        const context = relevantChunks.map((c) => `[${c.metadata.fileName}]\n${c.text}`).join("\n\n");
        
        const meta = await callGemini(
          analyzerKey,
          buildModulePrompt(m.name, m.topics, courseName.trim(), context),
          globalImages
        );
        
        moduleMetas.push(meta || { overview: "", objectives: [], estimatedHours: 0, difficulty: "Medium", prerequisites: "None" });
        
        // Small delay between module calls to avoid rate limits
        if (i < validModules.length - 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      // Phase 2: Topics with two-stage generation (with analysis caching)
      const topicDataMap = {};
      let completed = 0;
      let cacheHits = 0;
      const BATCH_SIZE = 2; // Reduced batch size for two-stage (more API calls)
      const allTopicJobs = validModules.flatMap((m, mi) =>
        m.topics.map((t, ti) => ({ mi, ti, topicName: t, moduleName: m.name }))
      );

      for (let i = 0; i < allTopicJobs.length; i += BATCH_SIZE) {
        const batch = allTopicJobs.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (job) => {
            // Find most relevant chunks for this specific topic
            const query = `${job.topicName} ${job.moduleName}`;
            const relevantChunks = findRelevantChunks(documentChunks, query, 8);

            // Try to get cached analysis first
            let extractedInfo = null;
            if (documentHashes.length > 0) {
              extractedInfo = await getCachedAnalysisResult(job.topicName, job.moduleName, documentHashes);
              if (extractedInfo) {
                cacheHits++;
                console.log(`[Cache] Using cached analysis for "${job.topicName}"`);
              }
            }

            // Generate with cached analysis if available
            const result = await generateTopicTwoStage(
              job.topicName,
              job.moduleName,
              courseName.trim(),
              depth,
              relevantChunks,
              apiKeys,
              globalImages,
              speedMode,
              extractedInfo // Pass cached analysis
            );

            // Cache the analysis result if we just generated it
            if (!extractedInfo && result && documentHashes.length > 0) {
              // Extract the analysis info from result if available
              if (result.sourcesUsed && result.sourcesUsed.length > 0) {
                await cacheAnalysisResult(job.topicName, job.moduleName, documentHashes, {
                  sources: result.sourcesUsed,
                  // Store minimal info for cache
                });
              }
            }

            return result;
          })
        );
        batch.forEach((job, idx) => { topicDataMap[`${job.mi}-${job.ti}`] = results[idx]; });
        completed += batch.length;
        const cacheMsg = cacheHits > 0 ? ` (${cacheHits} cached)` : "";
        setProgress(`Generating topics... ${completed}/${totalTopics}${cacheMsg} (${keyStats.mode} mode)`);
        if (i + BATCH_SIZE < allTopicJobs.length) await new Promise((r) => setTimeout(r, 1000));
      }

      if (cacheHits > 0) {
        showToast(`Used cache for ${cacheHits}/${totalTopics} topics`);
        updateCacheStats();
      }

      // Phase 3: Glossary (with error handling)
      setProgress("Generating glossary...");
      const allTopicNames = validModules.flatMap((m) => m.topics);
      let glossaryData = { terms: [] };
      
      try {
        const result = await callGemini(
          analyzerKey,
          buildGlossaryPrompt(courseName.trim(), allTopicNames)
        );
        if (result) {
          glossaryData = result;
        }
      } catch (err) {
        console.warn("Glossary generation failed, using empty glossary");
      }

      // Phase 4: Assemble
      setProgress("Assembling document...");
      const md = assembleMarkdown({ courseName: courseName.trim(), depth, modules: validModules, moduleMetas, topicDataMap, glossaryData });
      setOutput(md);
      
      // Cache the final document
      if (documentHashes.length > 0) {
        await cacheGeneratedDocument(courseName.trim(), validModules, documentHashes, md);
        updateCacheStats();
      }
      
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
            <button className={`api-key-btn ${apiKeys.length > 0 ? "saved" : ""}`} onClick={() => setShowKeyInput(!showKeyInput)}>
              <KeyIcon /> {apiKeys.length > 0 ? `${apiKeys.length} Key${apiKeys.length > 1 ? "s" : ""}` : "API Keys"}
            </button>
            {keyMode === "two-stage-optimal" && (
              <span className="nav-tag" style={{ background: "rgba(34, 197, 94, 0.08)", borderColor: "rgba(34, 197, 94, 0.2)", color: "#16a34a" }}>
                Optimal
              </span>
            )}
            {keyMode === "two-stage-fast" && (
              <span className="nav-tag" style={{ background: "rgba(59, 130, 246, 0.08)", borderColor: "rgba(59, 130, 246, 0.2)", color: "#2563eb" }}>
                Fast Mode
              </span>
            )}
          </div>
        </div>
        {showKeyInput && (
          <div className="api-key-panel">
            <div className="api-key-panel-inner">
              <label>Add API Key <span className="hint">— supports multiple free providers</span></label>
              <div className="api-key-row">
                <select style={{ width: 150, flexShrink: 0, height: 38, fontSize: 13, cursor: "pointer" }} value={newProvider} onChange={(e) => setNewProvider(e.target.value)}>
                  {PROVIDER_LIST.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input type="password" placeholder={PROVIDER_LIST.find((p) => p.id === newProvider)?.placeholder || "API key..."} value={newKey} onChange={(e) => setNewKey(e.target.value)} autoComplete="off" />
                <button 
                  className="btn-test-key" 
                  onClick={testKey}
                  disabled={testingKey || !newKey.trim()}
                  style={{ opacity: testingKey || !newKey.trim() ? 0.5 : 1 }}
                >
                  {testingKey ? "Testing..." : "Test"}
                </button>
                <button className="btn-save-key" onClick={addApiKey}>Add</button>
              </div>
              <p className="api-key-hint">
                Get key: <a href={PROVIDER_LIST.find((p) => p.id === newProvider)?.keyUrl} target="_blank" rel="noopener noreferrer">
                  {PROVIDER_LIST.find((p) => p.id === newProvider)?.keyUrl?.replace("https://", "")}
                </a>
                {" — "}{PROVIDER_LIST.find((p) => p.id === newProvider)?.note}
              </p>
              {keyMode !== "none" && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: keyMode.includes("optimal") ? "rgba(34, 197, 94, 0.06)" : keyMode.includes("fast") ? "rgba(59, 130, 246, 0.06)" : "rgba(234, 179, 8, 0.06)", border: `1px solid ${keyMode.includes("optimal") ? "rgba(34, 197, 94, 0.2)" : keyMode.includes("fast") ? "rgba(59, 130, 246, 0.2)" : "rgba(234, 179, 8, 0.2)"}`, borderRadius: 6, fontSize: 12, color: "var(--text-muted)" }}>
                  <strong style={{ color: keyMode.includes("optimal") ? "#16a34a" : keyMode.includes("fast") ? "#2563eb" : "#ca8a04" }}>
                    {keyMode === "two-stage-optimal" && "✓ Optimal Setup"}
                    {keyMode === "two-stage-fast" && "⚡ Fast Mode"}
                    {keyMode === "two-stage-hybrid" && "⚡ Hybrid Mode"}
                    {keyMode === "gemini-only" && "⚠ Gemini Only"}
                    {keyMode === "openrouter-only" && "⚠ OpenRouter Only"}
                    {keyMode === "groq-only" && "⚡ Groq Only"}
                  </strong>
                  <br />
                  {getKeyStats(apiKeys).description}
                </div>
              )}
              {apiKeys.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
                  {apiKeys.map((k, i) => {
                    const prov = PROVIDER_LIST.find((p) => p.id === k.providerId);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 6px 4px 8px", fontSize: 11 }}>
                        <span style={{ fontWeight: 600, color: "var(--accent)", fontSize: 10 }}>{prov?.name || k.providerId}</span>
                        <span style={{ color: "var(--text-dim)", fontFamily: "monospace", fontSize: 10 }}>...{k.key.slice(-6)}</span>
                        <button className="btn-remove" style={{ padding: 2 }} onClick={() => removeApiKey(i)}><XIcon /></button>
                      </div>
                    );
                  })}
                </div>
              )}
              {cacheStats.totalSizeMB > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                      Cache: {cacheStats.totalSizeMB} MB ({cacheStats.percentUsed}% used)
                    </span>
                    <button
                      onClick={() => { clearAllCaches(); updateCacheStats(); showToast("Cache cleared"); }}
                      style={{ fontSize: 10, padding: "3px 8px", background: "none", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-dim)", cursor: "pointer" }}
                    >
                      Clear Cache
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)" }}>
                    {cacheStats.counts.chunks > 0 && `${cacheStats.counts.chunks} documents, `}
                    {cacheStats.counts.analysis > 0 && `${cacheStats.counts.analysis} analyses, `}
                    {cacheStats.counts.document > 0 && `${cacheStats.counts.document} full docs`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <section className="hero">
        <h1>Generate <span className="highlight">Master Learning</span> Documents</h1>
        <p>Upload your class notes, define modules and topics — AI reads your material and generates a complete study document.</p>
        <div className="hero-pills">
          <span className="pill"><span className="pill-dot" /> Two-stage AI</span>
          <span className="pill"><span className="pill-dot" /> Upload notes</span>
          <span className="pill"><span className="pill-dot" /> Smart analysis</span>
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

            {/* Speed Mode Toggle */}
            {apiKeys.some((k) => k.providerId === "groq") && (
              <div className="field">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                  <input
                    type="checkbox"
                    checked={speedMode}
                    onChange={(e) => setSpeedMode(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <span>Speed Mode <span className="hint">— Use Groq for 3x faster generation (30 RPM)</span></span>
                </label>
              </div>
            )}

            {/* GLOBAL FILE UPLOAD */}
            <div className="field">
              <label>Reference Material <span className="hint">— upload class notes, slides, PDFs, images (optional)</span></label>
              <div
                className={`upload-zone ${dragOver ? "drag-over" : ""} ${globalFiles.length > 0 ? "has-files" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload reference files"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
                  style={{ display: "none" }}
                  onChange={(e) => { handleGlobalFiles(e.target.files); e.target.value = ""; }}
                />
                {globalFiles.length === 0 ? (
                  <div className="upload-zone-empty">
                    <UploadIcon size={20} />
                    <span>Drop files here or click to browse</span>
                    <span className="upload-zone-hint">PDF, PPT, DOC, images, text files</span>
                  </div>
                ) : (
                  <div className="upload-zone-files" onClick={(e) => e.stopPropagation()}>
                    <div className="upload-zone-header">
                      <span className="upload-zone-count">{globalFiles.length} file{globalFiles.length > 1 ? "s" : ""} uploaded</span>
                      <label className="btn-add-more" onClick={(e) => e.stopPropagation()}>
                        <PlusIcon /> Add more
                        <input
                          type="file"
                          multiple
                          accept="*/*"
                          style={{ display: "none" }}
                          onChange={(e) => { handleGlobalFiles(e.target.files); e.target.value = ""; }}
                        />
                      </label>
                    </div>
                    <div className="file-list">
                      {globalFiles.map((file, fi) => (
                        <div className="file-chip" key={fi}>
                          <span className="file-type-badge">{getFileIcon(file)}</span>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{formatFileSize(file.size)}</span>
                          <button type="button" className="file-remove" onClick={(e) => { e.stopPropagation(); removeGlobalFile(fi); }} aria-label={`Remove ${file.name}`}><XIcon /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="field">
              <label>Modules & Topics <span className="required">*</span><span className="hint">AI will match your uploaded notes to each module automatically</span></label>
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
                      </div>
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
