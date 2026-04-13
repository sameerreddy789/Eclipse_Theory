# Eclipse Theory

**AI-powered Master Learning Document Generator**

Transform your class notes, lecture slides, and study materials into comprehensive, structured study documents using advanced AI.

---

## 📖 Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Performance](#performance)
- [Use Cases](#use-cases)
- [Documentation](#documentation)
- [Installation](#installation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

Eclipse Theory is a **Next.js web application** that uses AI to generate comprehensive study documents from your uploaded materials. It employs a sophisticated **two-stage AI pipeline** with **smart caching** to create structured, exam-ready learning documents.

### Key Capabilities

- 📚 **Document Processing** - Extracts content from PDFs, DOCX, PPTX, images
- 🤖 **Two-Stage AI** - Separate analysis and writing for maximum accuracy
- 💾 **Smart Caching** - Up to 480x faster regeneration
- ⚡ **Speed Mode** - 3x faster with Groq (30 RPM)
- 🎯 **Intelligent Chunking** - Finds relevant sections for each topic
- 📄 **Multiple Exports** - Markdown and PDF output

---

## 🔄 How It Works

### User Workflow

```
1. Upload Documents (PDFs, slides, notes)
   ↓
2. Define Course Structure (modules + topics)
   ↓
3. Configure Settings (detail level, speed mode)
   ↓
4. Generate Document (AI processes everything)
   ↓
5. Download Output (Markdown or PDF)
```

### Behind the Scenes

```
┌─────────────────────────────────────────────────────────┐
│                    USER UPLOADS FILES                    │
│              PDFs, Slides, Notes, Images                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CACHING LAYER (Client-Side)                │
│  • Check if files already processed                     │
│  • Load chunks from localStorage (instant)              │
│  • Check if full document cached                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         DOCUMENT PROCESSING & CHUNKING                  │
│  • Extract text (pdf.js, fflate)                        │
│  • Split into 800-char chunks (150 overlap)            │
│  • Attach metadata (filename, position)                 │
│  • Cache chunks for future use                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│    STAGE 1: ANALYSIS (Gemini/Groq)                     │
│  • Check cache for previous analysis                    │
│  • Keyword search finds relevant chunks (8 per topic)   │
│  • AI extracts: definitions, examples, code             │
│  • Returns structured JSON                              │
│  • Cache analysis results                               │
│  • Cost: ~$0 (free tier)                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│    STAGE 2: WRITING (OpenRouter/Groq)                  │
│  • Takes extracted info from Stage 1                    │
│  • Generates comprehensive study notes                  │
│  • Includes: explanations, code, diagrams, Q&A          │
│  • Returns complete topic content                       │
│  • Cost: ~$0 (free models)                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         FINAL ASSEMBLY & EXPORT                         │
│  • Combines all topics into master document             │
│  • Adds: TOC, glossary, module overviews                │
│  • Validates all content present                        │
│  • Cache complete document                              │
│  • Export to Markdown or PDF (jsPDF)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### Framework: Next.js 15 (App Router)

Eclipse Theory is built on **Next.js 15** with the **App Router** architecture, providing:

- ✅ **Server Components** - Optimized initial page load
- ✅ **Client Components** - Interactive UI with React 19
- ✅ **API Routes** - Input validation endpoint
- ✅ **Static Generation** - Fast page delivery
- ✅ **Edge Runtime** - Global CDN deployment

### Component Structure

```
app/
├── layout.js              # Root layout (fonts, metadata)
├── page.js                # Main UI (client component)
├── globals.css            # Tailwind-inspired styles
│
├── api/
│   └── generate/
│       └── route.js       # Input validation API
│
└── lib/
    ├── gemini.js          # Multi-provider API client
    ├── files.js           # Document processing
    ├── markdown.js        # Document assembly
    ├── chunking.js        # Smart text chunking
    ├── twoStage.js        # Two-stage orchestration
    └── cache.js           # Client-side caching
```

### Data Flow

```
User Input (page.js)
    ↓
Validation (api/generate/route.js)
    ↓
File Processing (files.js)
    ↓
Chunking (chunking.js)
    ↓
Cache Check (cache.js)
    ↓
Two-Stage Generation (twoStage.js)
    ├─ Stage 1: Analysis (gemini.js)
    └─ Stage 2: Writing (gemini.js)
    ↓
Assembly (markdown.js)
    ↓
Cache & Export (cache.js + jsPDF)
```

### State Management

- **React Hooks** - `useState`, `useRef`, `useEffect`
- **localStorage** - API keys, cache data
- **No external state library** - Keeps bundle small

### Styling Approach

- **Custom CSS** - Tailwind-inspired utility classes
- **CSS Variables** - Theme customization
- **Responsive Design** - Mobile-first approach
- **No CSS framework** - Lightweight, custom design

---

## ✨ Features

### 1. Two-Stage AI Pipeline

**Why Two Stages?**
- **Reading documents is hard** - AI needs large context to understand
- **Writing content is easy** - AI excels at generating structured text
- **Separation of concerns** - Use best model for each task

**Stage 1: Analysis (Gemini/Groq)**
- Large context window (250K tokens)
- Extracts key information from documents
- Returns structured JSON data
- Caches results for reuse

**Stage 2: Writing (OpenRouter/Groq)**
- Takes extracted info as input
- Generates high-quality content
- Adds explanations, examples, insights
- Produces complete study notes

### 2. Smart Document Chunking

**Problem:** AI can't process entire 50-page PDFs at once

**Solution:** Intelligent chunking system
- Splits documents into 800-character chunks
- 150-character overlap preserves context
- Breaks at sentence boundaries
- Attaches metadata (filename, position)

**Retrieval:** Keyword-based search
- Finds top 8 relevant chunks per topic
- Reduces context from 12K → 3K chars
- Improves accuracy and speed

### 3. Multi-Provider Support

**Supported Providers:**

| Provider | Role | Context | Speed | Cost |
|----------|------|---------|-------|------|
| **Gemini** | Analyzer | 250K | Medium | Free |
| **OpenRouter** | Writer | 1M | Medium | Free* |
| **Groq** | Both | 128K | Fast | Free |

*Free models available

**Smart Selection:**
- Automatically chooses best provider per task
- Falls back if rate limits hit
- Rotates between multiple keys

### 4. Comprehensive Caching

**What Gets Cached:**

1. **Document Chunks** (5s savings per file)
   - SHA-256 hash of file content
   - Stored in localStorage
   - Instant reload on re-upload

2. **Analysis Results** (4s savings per topic)
   - Extracted information from Stage 1
   - Keyed by topic + document hashes
   - Skips re-analysis for same content

3. **Full Documents** (instant regeneration)
   - Complete markdown output
   - Keyed by course + structure + documents
   - 480x faster for exact same config

**Cache Management:**
- Automatic cleanup (7 days old)
- 50MB size limit
- Manual clear option
- Shows cache stats in UI

### 5. Speed Mode

**Normal Mode:**
- Gemini analyzes (10 RPM)
- OpenRouter writes (10 RPM)
- ~3 minutes for 20 topics

**Speed Mode (Groq):**
- Groq analyzes (30 RPM)
- Groq writes (30 RPM)
- ~1 minute for 20 topics
- **3x faster!**

### 6. Validation & Fallbacks

**Ensures Complete Output:**
- Validates all topics have data
- Provides fallback content if generation fails
- Shows warning for incomplete topics
- Guarantees exportable document

**Fallback Content:**
- Basic introduction
- Generic steps
- Placeholder sections
- Clear "regenerate" message

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **Custom CSS** - Tailwind-inspired styling
- **localStorage** - Client-side caching

### AI Providers
- **Google Gemini** - Document analysis (250K context)
- **OpenRouter** - High-quality writing
- **Groq** - Fast inference (800+ tok/s)

### Document Processing
- **pdf.js** - PDF text extraction
- **fflate** - ZIP/DOCX/PPTX processing
- **jsPDF** - PDF export

### Deployment
- **Vercel** - Hosting and CDN
- **Edge Runtime** - Global distribution
- **Automatic CI/CD** - Git push to deploy

### Development
- **Node.js** - Runtime environment
- **npm** - Package management
- **Git** - Version control

---

## 🚀 Quick Start

### 1. Get API Keys (Free)

Choose one or more:

- **Gemini** (Recommended): https://aistudio.google.com/apikey
- **OpenRouter**: https://openrouter.ai/keys
- **Groq** (Fastest): https://console.groq.com/keys

### 2. Add Keys in App

1. Click "API Keys" button
2. Select provider and paste key
3. Click "Test" to verify
4. Click "Add" if test passes

### 3. Upload Documents

Drag & drop your PDFs, slides, or notes into the upload zone.

### 4. Configure Course

- Enter course name
- Add modules and topics
- Enable Speed Mode (if you have Groq)

### 5. Generate!

Click "Generate Document" and wait 30 seconds to 5 minutes depending on size.

---

## 📊 Performance

| Configuration | 20 Topics | 50 Topics |
|---------------|-----------|-----------|
| **First Generation** | 2.5 min | 8 min |
| **With Cache** | 0.5 sec | 1 sec |
| **Speed Mode** | 1 min | 2.5 min |
| **Speed + Cache** | 0.5 sec | 1 sec |

### Rate Limits

| Provider | Requests/Min | Requests/Day |
|----------|--------------|--------------|
| Gemini | 10 | 500 |
| OpenRouter | 10 | Unlimited* |
| Groq | 30 | 14,400 |

*Free models

---

## 🎯 Use Cases

### For Students
- Create comprehensive study guides from lecture notes
- Combine multiple sources into one document
- Generate exam review materials
- Quick iterations with caching

### For Professors
- Create course materials from textbooks
- Generate student handouts
- Produce structured syllabi
- Batch process large courses

### For Self-Learners
- Organize online course notes
- Create reference documents
- Study for certifications
- Build personal knowledge base

---

## 📖 Documentation

- **[QUICK-START.md](QUICK-START.md)** - 5-minute setup guide
- **[GROQ-SUMMARY.md](GROQ-SUMMARY.md)** - Groq usage reference

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/sameerreddy789/Eclipse_Theory.git
cd Eclipse_Theory

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open http://localhost:3000 in your browser.

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Deploy automatically
4. Get production URL

Or use the deploy button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sameerreddy789/Eclipse_Theory)

### Manual Deployment

```bash
npm run build
npm start
```

Runs on port 3000 by default.

---

## 🔒 Privacy & Security

- ✅ **Client-side processing** - Documents never leave your browser
- ✅ **API keys stored locally** - In browser localStorage only
- ✅ **No server storage** - All caching is client-side
- ✅ **Secure hashing** - SHA-256 for cache keys
- ✅ **Automatic cleanup** - Old caches removed after 7 days

---

## 💰 Cost

### Free Tier (Typical Usage)

- **Gemini:** 500 requests/day (free)
- **OpenRouter:** Unlimited with free models
- **Groq:** 14,400 requests/day (free)

**Result:** $0 for most users

### Paid Tier (If Needed)

- **Gemini Pro:** ~$0.05 per 20 topics
- **OpenRouter (Claude):** ~$0.30 per 20 topics
- **Groq:** ~$0.15 per 20 topics (3x cheaper)

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Google Gemini for large context analysis
- OpenRouter for high-quality writing models
- Groq for blazing-fast inference
- pdf.js for PDF processing
- Next.js team for the framework

---

## 📧 Support

- **Issues:** [GitHub Issues](https://github.com/sameerreddy789/Eclipse_Theory/issues)
- **Discussions:** [GitHub Discussions](https://github.com/sameerreddy789/Eclipse_Theory/discussions)

---

## 🗺️ Roadmap

### v2.1 (Current)
- ✅ Two-stage AI pipeline
- ✅ Smart caching system
- ✅ Multi-provider support
- ✅ Speed Mode
- ✅ Validation & fallbacks

### v2.2 (Next)
- [ ] Semantic embeddings
- [ ] Cache compression
- [ ] Selective cache clearing
- [ ] Cache analytics

### v3.0 (Future)
- [ ] Cloud sync (optional)
- [ ] Collaborative features
- [ ] Advanced analytics
- [ ] Custom templates

---

**Built with ❤️ for learners who take notes seriously.**
