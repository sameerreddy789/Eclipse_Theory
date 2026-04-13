# Quick Start Guide

## 5-Minute Setup

### Step 1: Get API Keys (2 minutes)

**Option A: Optimal Setup (Recommended)**
1. Gemini: https://aistudio.google.com/apikey → Click "Create API Key"
2. OpenRouter: https://openrouter.ai/keys → Sign up → Create key
3. Groq: https://console.groq.com/keys → Sign up → Create key

**Option B: Minimal Setup (Fastest)**
1. Groq only: https://console.groq.com/keys → Sign up → Create key

### Step 2: Add Keys (1 minute)
1. Open Eclipse Theory
2. Click "API Keys" button in nav bar
3. Select provider from dropdown
4. Paste key
5. Click "Add"
6. Repeat for each key

### Step 3: Upload Documents (1 minute)
1. Drag & drop PDFs/slides into upload zone
2. Or click to browse files
3. See files listed with size

### Step 4: Configure Course (1 minute)
1. Enter course name (e.g., "Data Structures")
2. Select detail level (Brief or Detailed)
3. Add modules (e.g., "Arrays and Lists")
4. Add topics per module (e.g., "Dynamic Arrays", "Linked Lists")
5. Enable Speed Mode if you have Groq key

### Step 5: Generate! (30 seconds - 5 minutes)
1. Click "Generate Document"
2. Watch progress indicator
3. See cache hits if regenerating
4. Download as Markdown or PDF

## First-Time Generation

**What to expect:**
```
10 topics with 2 PDFs:
- Processing: 10 seconds
- Generation: 60 seconds
- Total: ~70 seconds

20 topics with 3 PDFs:
- Processing: 15 seconds
- Generation: 120 seconds
- Total: ~2.5 minutes
```

## Regeneration (With Cache)

**What to expect:**
```
Same configuration:
- Check cache: 0.5 seconds
- Load from cache: instant
- Total: 0.5 seconds ⚡
```

## Tips for Best Results

### 1. Upload Quality Documents
✅ Clear, well-formatted PDFs
✅ Lecture slides with text (not just images)
✅ Typed notes (not handwritten scans)
❌ Low-quality scans
❌ Image-only PDFs

### 2. Use Descriptive Topic Names
✅ "Binary Search Trees"
✅ "Merge Sort Algorithm"
❌ "Topic 1"
❌ "BST"

### 3. Match Topics to Documents
✅ Upload notes that cover your topics
✅ Use specific topic names that appear in documents
❌ Upload unrelated documents
❌ Use vague topic names

### 4. Choose Right Mode
**Speed Mode ON:**
- Large courses (50+ topics)
- Quick iterations
- Testing configurations

**Speed Mode OFF:**
- Final production documents
- Maximum quality needed
- Small courses (< 20 topics)

## Troubleshooting

### "No API keys configured"
**Solution:** Add at least one API key (Gemini, OpenRouter, or Groq)

### "Generation failed"
**Causes:**
- Invalid API key
- Rate limit exceeded
- Network error

**Solutions:**
1. Check API key is correct
2. Wait 1 minute and retry
3. Check internet connection

### "Topics are generic (not using my documents)"
**Causes:**
- Topic names don't match document content
- Documents not uploaded
- Poor quality document extraction

**Solutions:**
1. Use more specific topic names
2. Verify documents uploaded successfully
3. Check document text extraction quality

### "Too slow"
**Solutions:**
1. Add Groq API key
2. Enable Speed Mode
3. Use cache (regenerate same configuration)
4. Reduce number of topics

### "Cache not working"
**Check:**
- Using exact same files?
- Same topic/module names?
- Browser localStorage enabled?

**Solution:**
- Verify configuration is identical
- Check cache stats in API Keys panel

## Configuration Examples

### Example 1: Computer Science Course
```
Course: Data Structures & Algorithms
Detail: Detailed
Speed Mode: OFF (quality priority)

Module 1: Arrays and Lists
  - Dynamic Arrays
  - Linked Lists
  - Doubly Linked Lists

Module 2: Trees
  - Binary Trees
  - Binary Search Trees
  - AVL Trees

Module 3: Sorting
  - Bubble Sort
  - Merge Sort
  - Quick Sort

Documents: lecture-notes.pdf, textbook-chapter3.pdf
```

### Example 2: Quick Study Guide
```
Course: Exam Review - Algorithms
Detail: Brief
Speed Mode: ON (speed priority)

Module 1: Key Algorithms
  - Binary Search
  - DFS and BFS
  - Dijkstra's Algorithm
  - Dynamic Programming

Documents: exam-notes.pdf
```

### Example 3: Large Course
```
Course: Complete Web Development
Detail: Detailed
Speed Mode: ON (50+ topics)

Module 1: HTML & CSS (10 topics)
Module 2: JavaScript (15 topics)
Module 3: React (12 topics)
Module 4: Node.js (13 topics)

Documents: 5 PDFs (lecture slides)
```

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus course name input
- `Ctrl/Cmd + Enter` - Generate document (when form is valid)
- `Esc` - Close API key panel

## Cache Management

### View Cache Stats
1. Open API Keys panel
2. See cache size at bottom
3. Shows: documents, analyses, full docs cached

### Clear Cache
1. Open API Keys panel
2. Click "Clear Cache" button
3. Confirm in toast notification

### When to Clear Cache
- Cache over 40MB
- Testing different configurations
- Troubleshooting issues
- Before final production run

## Export Options

### Markdown (.md)
- Best for editing
- Can import to Notion, Obsidian
- Version control friendly
- Lightweight

### PDF
- Best for printing
- Professional appearance
- Easy to share
- Read-only

## Best Practices

### For Students
1. Upload all lecture notes before generating
2. Use descriptive topic names from syllabus
3. Generate once, cache for future edits
4. Export to PDF for studying

### For Professors
1. Use Detailed mode for comprehensive content
2. Add all course materials as documents
3. Enable Speed Mode for large courses
4. Review and edit exported markdown

### For Developers
1. Use Groq only for fastest iteration
2. Enable Speed Mode
3. Use cache for repeated tests
4. Clear cache between major changes

## Next Steps

After your first generation:

1. **Review Output**
   - Check if content matches your documents
   - Verify topic coverage
   - Look for any errors

2. **Iterate**
   - Adjust topic names if needed
   - Add more documents
   - Regenerate (uses cache!)

3. **Export**
   - Download as Markdown for editing
   - Or PDF for final version

4. **Share**
   - Share with classmates
   - Submit to professor
   - Use for studying

## Getting Help

### Check Documentation
- `FINAL-SUMMARY.md` - Complete overview
- `TWO-STAGE-SYSTEM.md` - Architecture details
- `GROQ-STRATEGIES.md` - Speed optimization
- `CACHING-GUIDE.md` - Cache system

### Common Issues
- API key errors → Check key validity
- Slow generation → Enable Speed Mode
- Generic content → Better topic names
- Cache issues → Clear and regenerate

## Success Metrics

You'll know it's working when:
- ✅ Topics reference your uploaded documents
- ✅ Content includes examples from your notes
- ✅ Sources listed match your files
- ✅ Regeneration is instant (cache hit)
- ✅ Export looks professional

## Recommended Workflow

### First Time
```
1. Add all 3 API keys (Gemini + OpenRouter + Groq)
2. Upload all course documents
3. Define complete module structure
4. Generate with Speed Mode OFF
5. Review output quality
6. Export to Markdown
```

### Iterations
```
1. Make small changes (1-2 topics)
2. Regenerate (cache speeds it up)
3. Review changes
4. Export when satisfied
```

### Final Version
```
1. Disable Speed Mode
2. Regenerate for best quality
3. Review thoroughly
4. Export to PDF
5. Share/submit
```

---

**You're ready to go! Start with Step 1 above.** 🚀
