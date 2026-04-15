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
        if (para.startsWith("<h") || para.startsWith("<ul") || para.startsWith("<pre") || para.startsWith("<hr") || para.startsWith("<blockquote")) {
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
