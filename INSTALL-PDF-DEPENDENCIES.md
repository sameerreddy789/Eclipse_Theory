# Install PDF Generation Dependencies

## Step 1: Install Node Packages

Run this command in your terminal:

```bash
npm install markdown-it@^14.1.0 puppeteer@^23.11.1
```

Or if you prefer to reinstall all dependencies:

```bash
npm install
```

## Step 2: Puppeteer Setup (Important!)

Puppeteer downloads Chromium automatically, but on some systems you may need additional setup:

### Windows
Usually works out of the box. If you get errors, install Visual C++ Redistributable:
https://aka.ms/vs/17/release/vc_redist.x64.exe

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### macOS
Usually works out of the box.

## Step 3: Vercel Deployment (if deploying)

If you're deploying to Vercel, you need to configure Puppeteer for serverless:

1. Create `vercel.json` (or update existing):

```json
{
  "functions": {
    "app/api/pdf/route.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

2. Update `app/api/pdf/route.js` to use `puppeteer-core` with `@sparticuz/chromium` for serverless:

```bash
npm install puppeteer-core @sparticuz/chromium
```

Then modify the API route to use:
```javascript
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

## Step 4: Test Locally

```bash
npm run dev
```

Then:
1. Generate a document
2. Click "PDF" button
3. Check if PDF downloads with proper formatting

## Troubleshooting

### Error: "Could not find Chrome"
- Run: `npx puppeteer browsers install chrome`

### Error: "Protocol error"
- Increase memory/timeout in vercel.json
- Or use a lighter PDF library (see alternative below)

### PDF generation is slow
- Normal! First generation takes 5-10 seconds (Chromium startup)
- Consider adding a loading indicator

## Alternative: Client-Side PDF (No Server Required)

If Puppeteer is too heavy, you can use a client-side approach with `jspdf` + `html2canvas`:

```bash
npm install jspdf html2canvas marked
```

This is lighter but has lower quality. Let me know if you want this implementation instead.

## What Changed

1. **Removed**: `jspdf` (basic, poor formatting)
2. **Added**: `markdown-it` (markdown parser) + `puppeteer` (PDF generator)
3. **Created**: `/api/pdf` route for server-side PDF generation
4. **Updated**: Client calls API instead of generating PDF locally

## Benefits

✅ Professional PDF formatting (like Word/Google Docs)
✅ Proper page breaks, margins, typography
✅ Code blocks, tables, blockquotes render correctly
✅ Supports all markdown features
✅ Print-quality output

## Next Steps

1. Run `npm install`
2. Test PDF generation locally
3. If deploying to Vercel, follow Step 3 above
