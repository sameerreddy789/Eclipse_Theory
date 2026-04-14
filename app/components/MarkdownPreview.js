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

    // Simple markdown to HTML converter (lightweight, no external deps)
    const convertMarkdown = (md) => {
      let html = md;

      // Escape HTML
      html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      // Code blocks
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || "text"}">${code.trim()}</code></pre>`;
      });

      // Inline code
      html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

      // Headers
      html = html.replace(/^#### (.*$)/gim, "<h4>$1</h4>");
      html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
      html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
      html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

      // Bold
      html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

      // Italic
      html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
      html = html.replace(/_(.+?)_/g, "<em>$1</em>");

      // Links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

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
      html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

      // Paragraphs
      html = html.split("\n\n").map((para) => {
        para = para.trim();
        if (!para) return "";
        if (para.startsWith("<h") || para.startsWith("<ul") || para.startsWith("<pre") || para.startsWith("<hr") || para.startsWith("<blockquote")) {
          return para;
        }
        return `<p>${para.replace(/\n/g, "<br>")}</p>`;
      }).join("\n");

      return html;
    };

    const htmlContent = convertMarkdown(markdown);
    containerRef.current.innerHTML = htmlContent;
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
