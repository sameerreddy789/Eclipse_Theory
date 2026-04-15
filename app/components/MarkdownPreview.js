/**
 * Markdown Preview Component
 * Renders markdown as a styled document (PDF-like preview)
 */

"use client";

import { useEffect, useRef } from "react";

export default function MarkdownPreview({ markdown }) {
  const containerRef = useRef(null);

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

      // Code blocks (non-greedy, limited)
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

      // Headers
      html = html.replace(/^#### (.{1,200})$/gim, "<h4>$1</h4>");
      html = html.replace(/^### (.{1,200})$/gim, "<h3>$1</h3>");
      html = html.replace(/^## (.{1,200})$/gim, "<h2>$1</h2>");
      html = html.replace(/^# (.{1,200})$/gim, "<h1>$1</h1>");

      // Bold (non-greedy, limited)
      html = html.replace(/\*\*(.{1,200}?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/__(.{1,200}?)__/g, "<strong>$1</strong>");

      // Italic (non-greedy, limited)
      html = html.replace(/\*(.{1,200}?)\*/g, "<em>$1</em>");
      html = html.replace(/_(.{1,200}?)_/g, "<em>$1</em>");

      // Links
      html = html.replace(/\[([^\]]{1,200})\]\(([^)]{1,500})\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

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
        if (para.startsWith("<h") || para.startsWith("<ul") || para.startsWith("<pre") || para.startsWith("<hr") || para.startsWith("<blockquote") || para.startsWith("<table")) {
          return para;
        }
        return `<p>${para.replace(/\n/g, "<br>")}</p>`;
      }).join("\n");

      return html;
    };

    try {
      const htmlContent = convertMarkdown(safeMarkdown);
      containerRef.current.innerHTML = htmlContent;
    } catch (err) {
      console.error("Markdown conversion error:", err);
      containerRef.current.innerHTML = "<p>Error rendering preview. Please use Markdown view.</p>";
    }
  }, [markdown]);

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
