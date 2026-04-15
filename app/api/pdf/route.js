/**
 * Server-side PDF generation from markdown
 * DISABLED: Puppeteer is too heavy for serverless deployment
 * 
 * Alternative: Use client-side PDF generation or external service
 */

import { NextResponse } from "next/server";

export async function POST(request) {
  return NextResponse.json(
    { 
      error: "PDF generation temporarily disabled", 
      details: "Server-side PDF generation with Puppeteer is not available in serverless environment. Please use 'Download .md' instead and convert locally, or use browser Print-to-PDF.",
      alternatives: [
        "Download markdown (.md) and convert locally",
        "Use browser Print-to-PDF (Ctrl+P on the preview)",
        "Copy content and paste into Word/Google Docs",
        "Use an online markdown-to-PDF converter"
      ]
    },
    { status: 503 }
  );
}
