/**
 * Server-side PDF generation from markdown
 * Uses markdown-it + puppeteer for high-quality PDF output
 */

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { markdown, filename } = await request.json();

    if (!markdown) {
      return NextResponse.json({ error: "No markdown provided" }, { status: 400 });
    }

    // Convert markdown to HTML with proper styling
    const MarkdownIt = (await import("markdown-it")).default;
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      breaks: true,
    });

    const htmlContent = md.render(markdown);

    // Create styled HTML document
    const styledHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 20mm;
      size: A4;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    
    h1 {
      font-size: 24pt;
      font-weight: 700;
      margin: 24pt 0 12pt 0;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8pt;
      page-break-after: avoid;
    }
    
    h2 {
      font-size: 18pt;
      font-weight: 700;
      margin: 20pt 0 10pt 0;
      color: #1e293b;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 14pt;
      font-weight: 600;
      margin: 16pt 0 8pt 0;
      color: #334155;
      page-break-after: avoid;
    }
    
    h4 {
      font-size: 12pt;
      font-weight: 600;
      margin: 12pt 0 6pt 0;
      color: #475569;
      page-break-after: avoid;
    }
    
    p {
      margin: 8pt 0;
      text-align: justify;
      orphans: 3;
      widows: 3;
    }
    
    ul, ol {
      margin: 8pt 0;
      padding-left: 20pt;
    }
    
    li {
      margin: 4pt 0;
    }
    
    code {
      background: #f1f5f9;
      padding: 2pt 4pt;
      border-radius: 3pt;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 10pt;
      color: #dc2626;
    }
    
    pre {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6pt;
      padding: 12pt;
      margin: 10pt 0;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    
    pre code {
      background: none;
      padding: 0;
      font-size: 9pt;
      line-height: 1.5;
      color: #1e293b;
    }
    
    blockquote {
      border-left: 4pt solid #cbd5e1;
      padding-left: 12pt;
      margin: 10pt 0;
      color: #64748b;
      font-style: italic;
      page-break-inside: avoid;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10pt 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6pt 10pt;
      text-align: left;
    }
    
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #0f172a;
    }
    
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 16pt 0;
    }
    
    strong {
      font-weight: 600;
      color: #0f172a;
    }
    
    em {
      font-style: italic;
    }
    
    a {
      color: #3b82f6;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
    }
    
    /* Prevent orphans and widows */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
    }
    
    /* Keep code blocks together */
    pre, blockquote, table {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `;

    // Use Puppeteer to generate PDF
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(styledHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename || "document"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: error.message },
      { status: 500 }
    );
  }
}
