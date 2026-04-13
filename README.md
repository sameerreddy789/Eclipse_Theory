# Eclipse Theory

**AI-powered Master Learning Document Generator**

Transform your class notes, lecture slides, and study materials into comprehensive, structured study documents using advanced AI.

## ✨ Features

- 🤖 **Two-Stage AI Pipeline** - Separate analysis and writing for maximum accuracy
- 📚 **Smart Document Processing** - Extracts content from PDFs, DOCX, PPTX, images
- 🎯 **Intelligent Chunking** - Finds relevant sections for each topic
- ⚡ **Speed Mode** - 3x faster generation with Groq
- 💾 **Smart Caching** - Up to 480x faster regeneration
- 🔄 **Multi-Provider** - Gemini, OpenRouter, Groq support
- 📄 **Multiple Exports** - Markdown and PDF output
- 🎨 **Professional Format** - Structured with TOC, glossary, examples

## 🚀 Quick Start

### 1. Get API Keys (Free)

Choose one or more:

- **Gemini** (Recommended for analysis): https://aistudio.google.com/apikey
- **OpenRouter** (Recommended for writing): https://openrouter.ai/keys
- **Groq** (Recommended for speed): https://console.groq.com/keys

### 2. Add Keys in App

1. Click "API Keys" button
2. Select provider and paste key
3. Click "Add"

### 3. Upload Documents

Drag & drop your PDFs, slides, or notes into the upload zone.

### 4. Configure Course

- Enter course name
- Add modules and topics
- Enable Speed Mode (if you have Groq)

### 5. Generate!

Click "Generate Document" and wait 30 seconds to 5 minutes depending on size.

## 📊 Performance

| Configuration | 20 Topics | 50 Topics |
|---------------|-----------|-----------|
| **First Generation** | 2.5 min | 8 min |
| **With Cache** | 0.5 sec | 1 sec |
| **Speed Mode** | 1 min | 2.5 min |
| **Speed + Cache** | 0.5 sec | 1 sec |

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

## 🏗️ Architecture

```
Upload Documents → Process & Chunk → Cache
                                      ↓
                            Stage 1: Analysis (Gemini/Groq)
                                      ↓
                            Stage 2: Writing (OpenRouter/Groq)
                                      ↓
                            Assemble & Export
```

### Two-Stage Pipeline

**Stage 1: Analysis**
- Gemini reads documents with 250K context window
- Extracts definitions, examples, code snippets
- Identifies key concepts and relationships
- Caches results for future use

**Stage 2: Writing**
- OpenRouter generates high-quality content
- Uses extracted info as foundation
- Adds explanations, analogies, examples
- Produces comprehensive study notes

## 🔧 Configuration Modes

### Optimal (Recommended)
```
✓ Gemini (analyzer)
✓ OpenRouter (writer)
✓ Groq (backup/speed)
```
**Result:** Best quality with speed option

### Fast
```
✓ Groq only
☑️ Speed Mode enabled
```
**Result:** 3x faster, good quality

### Balanced
```
✓ Groq (analyzer)
✓ OpenRouter (writer)
```
**Result:** Fast analysis + quality writing

## 💾 Caching System

### What Gets Cached

1. **Document Chunks** - Processed files (5s savings per file)
2. **Analysis Results** - Extracted info (4s savings per topic)
3. **Full Documents** - Complete output (instant regeneration)

### Cache Benefits

- **First generation:** Normal speed
- **Regeneration:** Up to 480x faster
- **Partial changes:** Only regenerate changed topics
- **Automatic management:** Clears old entries, manages size

## 📖 Documentation

- **[QUICK-START.md](QUICK-START.md)** - 5-minute setup guide
- **[FINAL-SUMMARY.md](FINAL-SUMMARY.md)** - Complete system overview
- **[TWO-STAGE-SYSTEM.md](TWO-STAGE-SYSTEM.md)** - Architecture details
- **[GROQ-STRATEGIES.md](GROQ-STRATEGIES.md)** - Speed optimization guide
- **[CACHING-GUIDE.md](CACHING-GUIDE.md)** - Caching system explained

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19
- **AI Providers:** Gemini, OpenRouter, Groq
- **Document Processing:** pdf.js, fflate
- **Export:** jsPDF
- **Storage:** localStorage (client-side caching)

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/eclipse-theory.git

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🌐 Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/eclipse-theory)

Or deploy manually:

```bash
npm run build
npm start
```

## 🔒 Privacy & Security

- ✅ **Client-side processing** - Documents never leave your browser
- ✅ **API keys stored locally** - In browser localStorage only
- ✅ **No server storage** - All caching is client-side
- ✅ **Secure hashing** - SHA-256 for cache keys
- ✅ **Automatic cleanup** - Old caches removed after 7 days

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

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini for large context analysis
- OpenRouter for high-quality writing models
- Groq for blazing-fast inference
- pdf.js for PDF processing
- Next.js team for the framework

## 📧 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/eclipse-theory/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/eclipse-theory/discussions)
- **Email:** support@eclipse-theory.com

## 🗺️ Roadmap

### v2.1 (Current)
- ✅ Two-stage AI pipeline
- ✅ Smart caching system
- ✅ Multi-provider support
- ✅ Speed Mode

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

## ⭐ Star History

If you find Eclipse Theory useful, please star the repository!

---

**Built with ❤️ for learners who take notes seriously.**
