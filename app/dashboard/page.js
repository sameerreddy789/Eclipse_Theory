"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import { deductCredit } from "../lib/credits";
import "../globals.css";

// Libs
import { callGemini, buildModulePrompt, buildGlossaryPrompt, PROVIDER_LIST, getKeyStats } from "../lib/ai/gemini";
import { slugify, assembleMarkdown } from "../lib/content/markdown";
import { processFiles, getFileIcon, formatFileSize } from "../lib/files";
import { chunkDocuments, findRelevantChunks, generateChunkEmbeddings } from "../lib/content/chunking";
import { hybridSearch } from "../lib/content/embeddings";
import { extractTextFromImage, isImageFile } from "../lib/ocr";
import { generateAnkiCSV, generateNotionMarkdown, generateStudyChecklist, downloadFile } from "../lib/export";
import { generateTopicTwoStage } from "../lib/ai/twoStage";
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
} from "../lib/storage/cache";
import {
  saveToHistory,
  getHistory,
  deleteHistoryItem,
  clearHistory,
  getHistoryStats,
} from "../lib/storage/history";
import { parseTextStructure, validateExtractedStructure, getExtractionStats } from "../lib/ai/topicExtractor";
import { doc, db } from "../lib/firebase";
import { updateDoc } from "firebase/firestore";

// Components
import MarkdownPreview from "../components/MarkdownPreview";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import APIKeyPanel from "../components/dashboard/APIKeyPanel";
import HistoryPanel from "../components/dashboard/HistoryPanel";
import ModuleBlock from "../components/dashboard/ModuleBlock";
import UpgradeModal from "../components/dashboard/UpgradeModal";
import { X, Upload, Plus, ChevronRight, Copy, Share2, Sparkles } from "lucide-react";

let nextModuleId = 1000;
let nextTopicId = 5000;

export default function DashboardPage() {
  const { user, userData, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // State
  const [apiKeys, setApiKeys] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  // ... (rest of state)

  const [topicDataMapState, setTopicDataMapState] = useState({});
  const [moduleMetasState, setModuleMetasState] = useState([]);
  const [glossaryDataState, setGlossaryDataState] = useState({ terms: [] });
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [depth, setDepth] = useState("detailed");
  const [speedMode, setSpeedMode] = useState(false);
  const [useSemanticSearch, setUseSemanticSearch] = useState(true);
  const [useOCR, setUseOCR] = useState(false);
  const [globalFiles, setGlobalFiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyStats, setHistoryStats] = useState({ totalDocuments: 0, totalTopics: 0, totalSizeMB: "0.00" });
  const [previewMode, setPreviewMode] = useState("preview");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractedModules, setExtractedModules] = useState(null);
  const [extractionError, setExtractionError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [modules, setModules] = useState([{ id: 1, name: "", topics: [{ id: 1, name: "" }] }]);
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState("");
  const [cacheStats, setCacheStats] = useState({ totalSizeMB: "0", counts: {} });
  
  const outputRef = useRef(null);
  const fileInputRef = useRef(null);
  const keyIndexRef = useRef(0);

  // Sync settings with Firestore
  const syncSettings = async (updates) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updates);
    } catch (err) { console.error("Sync failed:", err); }
  };

  useEffect(() => {
    if (userData?.api_keys) setApiKeys(userData.api_keys);
    clearOldCaches(7);
    updateCacheStats();
    updateHistoryStats();
  }, [userData]);

  const updateCacheStats = () => setCacheStats(getCacheStats());
  const updateHistoryStats = () => { setHistory(getHistory()); setHistoryStats(getHistoryStats()); };

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }, []);

  // CRUD Handlers
  const addModule = () => setModules([...modules, { id: ++nextModuleId, name: "", topics: [{ id: ++nextTopicId, name: "" }] }]);
  const removeModule = (id) => setModules(modules.filter(m => m.id !== id));
  const updateModuleName = (id, name) => setModules(modules.map(m => m.id === id ? { ...m, name } : m));
  const addTopic = (mId) => setModules(modules.map(m => m.id === mId ? { ...m, topics: [...m.topics, { id: ++nextTopicId, name: "" }] } : m));
  const removeTopic = (mId, tId) => setModules(modules.map(m => m.id === mId ? { ...m, topics: m.topics.filter(t => t.id !== tId) } : m));
  const updateTopicName = (mId, tId, name) => setModules(modules.map(m => m.id === mId ? { ...m, topics: m.topics.map(t => t.id === tId ? { ...t, name } : t) } : m));

  const handleAddKey = (providerId, key) => {
    if (!key.trim()) return;
    const updated = [...apiKeys, { providerId, key: key.trim() }];
    setApiKeys(updated);
    syncSettings({ api_keys: updated });
    showToast("Key added");
  };

  const handleRemoveKey = (idx) => {
    const updated = apiKeys.filter((_, i) => i !== idx);
    setApiKeys(updated);
    syncSettings({ api_keys: updated });
    showToast("Key removed");
  };

  const handleGlobalFiles = (files) => {
    const newFiles = Array.from(files);
    setGlobalFiles([...globalFiles, ...newFiles]);
    showToast(`${files.length} files added`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (apiKeys.length === 0) { setShowKeyInput(true); showToast("Add an API key first"); return; }
    if (!courseName.trim()) { showToast("Enter a course name"); return; }

    const validModules = modules
      .filter(m => m.name.trim())
      .map(m => ({ name: m.name.trim(), topics: m.topics.filter(t => t.name.trim()).map(t => t.name.trim()) }))
      .filter(m => m.topics.length > 0);

    if (!validModules.length) { showToast("Add at least one module"); return; }

    setLoading(true); setOutput(""); setTopicDataMapState({});
    
    try {
      const idToken = await user.getIdToken();
      const gateRes = await fetch("/api/ai/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ action: "GENERATE_MODULE", payload: { courseName: courseName.trim(), modules: validModules.length } })
      });

      if (!gateRes.ok) {
        const err = await gateRes.json();
        showToast(err.error || "Authorization failed");
        setLoading(false); return;
      }

      // Phase 0: Process and chunk all global files (with caching)
      let documentChunks = [];
      let documentHashes = [];
      let globalImages = [];

      if (globalFiles.length > 0) {
        setProgress(`Processing ${globalFiles.length} uploaded files...`);
        
        const filesToProcess = [];
        for (const file of globalFiles) {
          if (useOCR && isImageFile(file)) {
            setProgress(`Running OCR on ${file.name}...`);
            const ocrResult = await extractTextFromImage(file, (p) => setProgress(`OCR: ${file.name} (${p}%)`));
            if (ocrResult.success && ocrResult.text.length > 50) {
              filesToProcess.push({ ...file, ocrText: ocrResult.text });
            } else filesToProcess.push(file);
          } else filesToProcess.push(file);
        }
        
        const { processedFiles, images } = await processFiles(filesToProcess);
        globalImages = images;

        for (const file of globalFiles) {
          const cached = await getCachedDocumentChunks(file);
          if (cached) {
            documentChunks.push(...cached.chunks);
            documentHashes.push(cached.hash);
          } else {
            const fileData = processedFiles.find(pf => pf.fileName === file.name);
            if (fileData) {
              const chunks = chunkDocuments([fileData]);
              const hash = await cacheDocumentChunks(file, chunks);
              documentChunks.push(...chunks);
              if (hash) documentHashes.push(hash);
            }
          }
        }
        
        if (useSemanticSearch && documentChunks.length > 0) {
          setProgress(`Generating embeddings for ${documentChunks.length} chunks...`);
          documentChunks = await generateChunkEmbeddings(documentChunks, (c, t) => setProgress(`Embeddings... ${c}/${t}`));
        }
      }

      // Check if we can use cached full document
      if (documentHashes.length > 0) {
        const cachedDoc = await getCachedGeneratedDocument(courseName.trim(), validModules, documentHashes, depth, { useSemanticSearch, useOCR, preferSpeed: speedMode });
        if (cachedDoc) {
          setOutput(cachedDoc);
          setLoading(false); setProgress(""); return;
        }
      }

      // Phase 1: Module metadata
      setProgress(`Generating module overviews (${validModules.length})...`);
      const analyzerKey = apiKeys.find(k => k.providerId === "gemini") || apiKeys[0];
      const moduleMetas = [];
      for (let i = 0; i < validModules.length; i++) {
        const m = validModules[i];
        const relevantChunks = findRelevantChunks(documentChunks, m.name, 5);
        const context = relevantChunks.map(c => `[${c.metadata.fileName}]\n${c.text}`).join("\n\n");
        const meta = await callGemini(analyzerKey, buildModulePrompt(m.name, m.topics, courseName.trim(), context), globalImages);
        moduleMetas.push(meta || { overview: `Module: ${m.name}` });
        if (i < validModules.length - 1) await new Promise(r => setTimeout(r, 4000));
      }

      // Phase 2: Topics with two-stage generation
      const topicDataMap = {};
      const allTopicJobs = validModules.flatMap((m, mi) => m.topics.map((t, ti) => ({ mi, ti, topicName: t, moduleName: m.name })));
      for (let i = 0; i < allTopicJobs.length; i++) {
        const job = allTopicJobs[i];
        setProgress(`Generating topics... ${i+1}/${allTopicJobs.length}`);
        
        const query = `${job.topicName} ${job.moduleName}`;
        const relevantChunks = useSemanticSearch ? await hybridSearch(query, documentChunks, 8) : findRelevantChunks(documentChunks, query, 8);

        const result = await generateTopicTwoStage(job.topicName, job.moduleName, courseName.trim(), depth, relevantChunks, apiKeys, globalImages, speedMode);
        topicDataMap[`${job.mi}-${job.ti}`] = result;
        if (i < allTopicJobs.length - 1) await new Promise(r => setTimeout(r, 3000));
      }

      // Phase 3: Glossary
      setProgress("Generating glossary...");
      const allTopicNames = validModules.flatMap(m => m.topics);
      const glossaryData = await callGemini(apiKeys[0], buildGlossaryPrompt(courseName.trim(), allTopicNames)) || { terms: [] };

      // Phase 4: Assemble
      const md = assembleMarkdown({ courseName: courseName.trim(), depth, modules: validModules, moduleMetas, topicDataMap, glossaryData });
      setOutput(md);
      setTopicDataMapState(topicDataMap);
      setModuleMetasState(moduleMetas);
      setGlossaryDataState(glossaryData);
      
      saveToHistory(courseName.trim(), validModules, md, { depth, fileCount: globalFiles.length });
      updateHistoryStats();
      
    } catch (err) {
      console.error(err);
      showToast("Generation failed");
    } finally {
      setLoading(false); setProgress("");
    }
  };

  // Export Handlers
  const downloadAnki = () => {
    const validModules = modules.map(m => ({ name: m.name, topics: m.topics.map(t => t.name) }));
    const csv = generateAnkiCSV(courseName, validModules, topicDataMapState);
    downloadFile(csv, slugify(courseName) + "-anki.csv", "text/csv");
  };

  const handleUpgradeSuccess = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { 
        plan: 'premium', 
        credits_remaining: 100, // Large amount for demo
        last_active: new Date()
      });
      setShowUpgradeModal(false);
      showToast("🚀 UPGRADED TO PREMIUM! Enjoy unlimited power.");
    } catch (e) {
      console.error(e);
      showToast("Upgrade failed to sync");
    }
  };

  if (authLoading || !user) return <div className="auth-container"><Zap className="animate-spin" /></div>;

  return (
    <div className="landing-page">
      {/* ... nav */}
      <DashboardNavbar 
        user={user} 
        userData={userData} 
        historyCount={history.length} 
        apiKeyCount={apiKeys.length} 
        keyMode={getKeyStats(apiKeys).mode}
        onToggleHistory={() => setShowHistory(!showHistory)}
        onToggleKeys={() => setShowKeyInput(!showKeyInput)}
        onLogout={logout}
      />

      {showKeyInput && (
        <APIKeyPanel 
          apiKeys={apiKeys} 
          onAddKey={handleAddKey} 
          onRemoveKey={handleRemoveKey}
          keyMode={getKeyStats(apiKeys).mode}
          cacheStats={cacheStats}
          onClearCache={() => { clearAllCaches(); updateCacheStats(); }}
          showToast={showToast}
        />
      )}

      {showHistory && (
        <HistoryPanel 
          history={history} 
          historyStats={historyStats} 
          onLoadItem={(item) => { setOutput(item.output); setCourseName(item.courseName); setShowHistory(false); }}
          onDeleteItem={(id) => { deleteHistoryItem(id); updateHistoryStats(); }}
          onClearAll={() => { clearHistory(); updateHistoryStats(); }}
        />
      )}

      {showUpgradeModal && (
        <UpgradeModal 
          user={user} 
          onClose={() => setShowUpgradeModal(false)} 
          onUpgrade={handleUpgradeSuccess} 
        />
      )}

      <div className="hero" style={{ padding: '80px 24px 40px' }}>
        <h1>Generate <span className="highlight">Master Learning</span> Documents</h1>
        <p>Your SaaS Intelligence Engine for deep learning.</p>
        
        {userData?.plan === 'free' && (
          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="btn-save-key" 
            style={{ marginTop: 20, padding: '12px 24px', fontSize: 14, background: 'linear-gradient(to right, #D4AF37, #F9D976)', color: '#000', border: 'none' }}
          >
            <Sparkles size={16} style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }} />
            UPGRADE TO PREMIUM
          </button>
        )}
        
        {/* Referral Card */}
        <div style={{ maxWidth: 500, margin: '20px auto', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--accent)', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Share2 size={20} color="var(--accent)" />
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)' }}>REFER FRIENDS, EARN CREDITS</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Share your link: <code>{window?.location?.origin}/signup?ref={userData?.referral_code}</code></div>
          </div>
          <button className="btn-save-key" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${userData.referral_code}`); showToast("Referral link copied!"); }}>Copy Link</button>
        </div>
      </div>

      <section className="form-section">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label>Course Name</label>
                <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="e.g. Quantum Physics" />
              </div>
              <div className="field">
                <label>Detail Level</label>
                <select value={depth} onChange={e => setDepth(e.target.value)}>
                  <option value="brief">Brief</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Reference Material</label>
              <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
                <input type="file" ref={fileInputRef} multiple style={{ display: 'none' }} onChange={e => handleGlobalFiles(e.target.files)} />
                <Upload size={20} />
                <span>{globalFiles.length > 0 ? `${globalFiles.length} files uploaded` : "Drop files here or browse"}</span>
              </div>
            </div>

            <div className="field">
              <label>Modules & Topics</label>
              <div className="modules-wrap">
                {modules.map((m, mi) => (
                  <ModuleBlock 
                    key={m.id} 
                    mod={m} 
                    mi={mi} 
                    onUpdateName={updateModuleName} 
                    onRemove={removeModule}
                    onAddTopic={addTopic}
                    onRemoveTopic={removeTopic}
                    onUpdateTopicName={updateTopicName}
                  />
                ))}
              </div>
              <button type="button" className="btn-add" onClick={addModule}><Plus size={14} /> Add Module</button>
            </div>

            <button type="submit" className="btn-generate" disabled={loading}>
              {loading ? progress || "Generating..." : "Generate Master Document"}
            </button>
          </form>
        </div>
      </section>

      {output && (
        <section className="output-section visible" ref={outputRef}>
          <div className="output-card">
            <div className="output-bar">
              <h2>Document Preview</h2>
              <div className="output-bar-actions">
                <button className="btn-ghost" onClick={() => setPreviewMode(previewMode === 'preview' ? 'markdown' : 'preview')}>{previewMode === 'preview' ? 'Markdown' : 'Preview'}</button>
                <button className="btn-ghost" onClick={downloadAnki}>Anki Cards</button>
                <button className="btn-pdf">Export PDF</button>
              </div>
            </div>
            <div className="output-content">
              {previewMode === 'preview' ? <MarkdownPreview markdown={output} /> : <pre>{output}</pre>}
            </div>
          </div>
        </section>
      )}

      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </div>
  );
}
