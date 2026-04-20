/**
 * Markdown Preview Component
 * Renders markdown as a styled document (PDF-like preview)
 * Supports Mermaid diagrams via CDN
 */

"use client";

import { useEffect, useRef, useState } from "react";

// Load Mermaid CDN once
let mermaidLoaded = false;
let mermaidLoadPromise = null;

function loadMermaid() {
  if (mermaidLoaded && window.mermaid) return Promise.resolve();
  if (mermaidLoadPromise) return mermaidLoadPromise;

  mermaidLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.mermaid) {
      mermaidLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        themeVariables: {
          primaryColor: "#f5f0e8",
          primaryTextColor: "#1a1a1a",
          primaryBorderColor: "#d4af37",
          lineColor: "#8b7355",
          secondaryColor: "#faf6ee",
          tertiaryColor: "#fff",
        },
      });
      mermaidLoaded = true;
      resolve();
    };
    script.onerror = () => {
      mermaidLoadPromise = null;
      reject(new Error("Failed to load Mermaid"));
    };
    document.head.appendChild(script);
  });

  return mermaidLoadPromise;
}

export default function MarkdownPreview({ markdown }) {
  const containerRef = useRef(null);
  const [mermaidReady, setMermaidReady] = useState(false);

  // Load Mermaid on mount if markdown contains mermaid blocks
  useEffect(() => {
    if (markdown && markdown.includes("```mermaid")) {
      loadMermaid()
        .then(() => setMermaidReady(true))
        .catch((err) => console.warn("Mermaid load failed:", err));
    }
  }, [markdown]);

  useEffect(() => {
    if (!containerRef.current || !markdown) return;

    // Limit markdown size to prevent performance issues
    const maxLength = 100000; // 100KB
    const safeMarkdown = markdown.length > maxLength 
      ? markdown.substring(0, maxLength) + "\n\n... (content truncated for performance)"
      : markdown;

    // Simple markdown to HTML converter (lightweight, no external deps)
    const convertMarkdown = (md) => {
      let html = md;

      // Escape HTML first
      html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      // Mermaid code blocks — render as special divs
      html = html.replace(/```mermaid\n([\s\S]{0,10000}?)```/g, (match, code) => {
        const id = "mermaid-" + Math.random().toString(36).substr(2, 9);
        return `<div class="mermaid-container"><div class="mermaid-diagram" data-mermaid-id="${id}">${code.trim()}</div></div>`;
      });

      // Code blocks (non-greedy, limited) — after mermaid to avoid conflicts
      html = html.replace(/```(\w+)?\n([\s\S]{0,5000}?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || "text"}">${code.trim()}</code></pre>`;
      });

      // Tables (must be before inline code)
      html = html.replace(/^\|(.+)\|$/gim, (match) => {
        // Check if it's a separator row
        if (match.match(/^\|[\s\-:|]+\|$/)) {
          return "|||SEPARATOR|||";
        }
        return match;
      });

      // Convert tables to HTML
      const lines = html.split('\n');
      const processedLines = [];
      let inTable = false;
      let tableRows = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('|') && line.endsWith('|')) {
          if (!inTable) {
            inTable = true;
            tableRows = [];
          }
          
          if (line === '|||SEPARATOR|||') {
            // This is the header separator, mark previous row as header
            if (tableRows.length > 0) {
              const headerCells = tableRows[tableRows.length - 1];
              tableRows[tableRows.length - 1] = `<thead><tr>${headerCells.map(cell => `<th>${cell}</th>`).join('')}</tr></thead>`;
            }
          } else {
            // Regular table row
            const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
            tableRows.push(cells);
          }
        } else {
          // Not a table line
          if (inTable) {
            // End of table, convert to HTML
            let tableHtml = '<table>';
            
            for (let j = 0; j < tableRows.length; j++) {
              const row = tableRows[j];
              if (typeof row === 'string') {
                // Already processed as header
                tableHtml += row;
              } else {
                // Regular row
                if (j === 0 && tableRows.length > 1 && typeof tableRows[1] !== 'string') {
                  // First row without separator = header
                  tableHtml += `<thead><tr>${row.map(cell => `<th>${cell}</th>`).join('')}</tr></thead><tbody>`;
                } else {
                  if (j === 1 && typeof tableRows[0] === 'string') {
                    tableHtml += '<tbody>';
                  }
                  tableHtml += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                }
              }
            }
            
            tableHtml += '</tbody></table>';
            processedLines.push(tableHtml);
            inTable = false;
            tableRows = [];
          }
          processedLines.push(line);
        }
      }

      // Handle table at end of document
      if (inTable && tableRows.length > 0) {
        let tableHtml = '<table><tbody>';
        for (const row of tableRows) {
          if (typeof row !== 'string') {
            tableHtml += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
          }
        }
        tableHtml += '</tbody></table>';
        processedLines.push(tableHtml);
      }

      html = processedLines.join('\n');

      // Inline code (non-greedy, limited)
      html = html.replace(/`([^`]{1,200})`/g, "<code>$1</code>");

      // Headers — add id attributes for TOC anchor navigation
      const slugify = (text) => text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      html = html.replace(/^#### (.{1,200})$/gim, (_, text) => `<h4 id="${slugify(text)}">${text}</h4>`);
      html = html.replace(/^### (.{1,200})$/gim, (_, text) => `<h3 id="${slugify(text)}">${text}</h3>`);
      html = html.replace(/^## (.{1,200})$/gim, (_, text) => `<h2 id="${slugify(text)}">${text}</h2>`);
      html = html.replace(/^# (.{1,200})$/gim, (_, text) => `<h1 id="${slugify(text)}">${text}</h1>`);

      // Bold (non-greedy, limited)
      html = html.replace(/\*\*(.{1,200}?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/__(.{1,200}?)__/g, "<strong>$1</strong>");

      // Italic (non-greedy, limited)
      html = html.replace(/\*(.{1,200}?)\*/g, "<em>$1</em>");
      html = html.replace(/_(.{1,200}?)_/g, "<em>$1</em>");

      // Links — internal anchor links scroll within preview, external links open new tab
      html = html.replace(/\[([^\]]{1,200})\]\(([^)]{1,500})\)/g, (_, text, href) => {
        if (href.startsWith('#')) {
          return `<a href="${href}" class="toc-link" data-anchor="${href.slice(1)}">${text}</a>`;
        }
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      });

      // Horizontal rules
      html = html.replace(/^---$/gim, "<hr>");
      html = html.replace(/^\*\*\*$/gim, "<hr>");

      // Blockquotes
      html = html.replace(/^&gt; (.+)$/gim, "<blockquote>$1</blockquote>");

      // Lists
      html = html.replace(/^\* (.+)$/gim, "<li>$1</li>");
      html = html.replace(/^- (.+)$/gim, "<li>$1</li>");
      html = html.replace(/^\d+\. (.+)$/gim, "<li>$1</li>");

      // Wrap consecutive <li> in <ul>
      html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

      // Paragraphs (split and process in chunks to avoid performance issues)
      const paragraphs = html.split("\n\n");
      html = paragraphs.map((para) => {
        para = para.trim();
        if (!para) return "";
        if (para.startsWith("<h") || para.startsWith("<ul") || para.startsWith("<pre") || para.startsWith("<hr") || para.startsWith("<blockquote") || para.startsWith("<table") || para.startsWith("<div")) {
          return para;
        }
        return `<p>${para.replace(/\n/g, "<br>")}</p>`;
      }).join("\n");

      return html;
    };

    try {
      const htmlContent = convertMarkdown(safeMarkdown);
      containerRef.current.innerHTML = htmlContent;

      // Render Mermaid diagrams after DOM is set
      if (mermaidReady && window.mermaid) {
        const mermaidDivs = containerRef.current.querySelectorAll(".mermaid-diagram");
        if (mermaidDivs.length > 0) {
          renderMermaidDiagrams(mermaidDivs);
        }
      }

      // TOC anchor link click handler — smooth scroll to heading
      const tocLinks = containerRef.current.querySelectorAll("a.toc-link");
      tocLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const anchor = link.getAttribute("data-anchor");
          if (!anchor) return;

          // Find the target element by id
          const target = containerRef.current.querySelector(`#${CSS.escape(anchor)}`);
          if (target) {
            // Scroll the preview container's parent (output-content) to the target
            const scrollParent = containerRef.current.closest(".output-content") || containerRef.current.parentElement;
            if (scrollParent) {
              const targetTop = target.offsetTop - scrollParent.offsetTop;
              scrollParent.scrollTo({ top: targetTop - 20, behavior: "smooth" });
            } else {
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        });
      });
    } catch (err) {
      console.error("Markdown conversion error:", err);
      containerRef.current.innerHTML = "<p>Error rendering preview. Please use Markdown view.</p>";
    }
  }, [markdown, mermaidReady]);

  return (
    <div
      ref={containerRef}
      className="markdown-preview"
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        fontSize: "15px",
        lineHeight: "1.7",
        color: "#1a1a1a",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 60px",
        background: "white",
        minHeight: "100%",
      }}
    />
  );
}

/**
 * Render all mermaid diagram divs
 */
async function renderMermaidDiagrams(divs) {
  for (const div of divs) {
    const code = div.textContent;
    const id = div.getAttribute("data-mermaid-id") || "mermaid-" + Math.random().toString(36).substr(2, 9);

    try {
      const { svg } = await window.mermaid.render(id, code);
      div.innerHTML = svg;
      div.classList.add("mermaid-rendered");
    } catch (err) {
      console.warn("Mermaid render failed for diagram:", err);
      // Fallback: show as styled code block
      div.innerHTML = `<pre style="background:#faf6ee;padding:16px;border-radius:8px;border:1px solid #e8dcc8;font-size:13px;overflow-x:auto;"><code>${escapeHtml(code)}</code></pre>`;
      div.classList.add("mermaid-fallback");
    }
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
