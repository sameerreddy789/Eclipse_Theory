/**
 * Process uploaded files into content that can be sent to Gemini.
 * - PDF → extract text via pdf.js
 * - Images (png, jpg, gif, webp) → base64 for Gemini multimodal
 * - DOC/DOCX/PPT/PPTX/TXT → read as text where possible
 */

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_TEXT_CHARS = 12000; // Cap text context per module to avoid token overflow

export async function processFiles(files) {
  const textParts = [];
  const imageParts = [];

  for (const file of files) {
    try {
      if (file.type === "application/pdf") {
        const text = await extractPdfText(file);
        if (text) textParts.push(`[PDF: ${file.name}]\n${text}`);
      } else if (IMAGE_TYPES.includes(file.type)) {
        const b64 = await fileToBase64(file);
        imageParts.push({ mimeType: file.type, data: b64 });
      } else if (
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".csv")
      ) {
        const text = await file.text();
        if (text) textParts.push(`[File: ${file.name}]\n${text}`);
      } else if (
        file.name.endsWith(".pptx") ||
        file.name.endsWith(".docx")
      ) {
        // For PPTX/DOCX, extract what we can from the XML inside the zip
        const text = await extractOfficeText(file);
        if (text) textParts.push(`[${file.name}]\n${text}`);
      } else {
        // Try reading as text for unknown types
        try {
          const text = await file.text();
          if (text && text.length > 20) textParts.push(`[File: ${file.name}]\n${text.slice(0, 5000)}`);
        } catch {
          // Skip unreadable files
        }
      }
    } catch (err) {
      console.warn(`Failed to process ${file.name}:`, err);
    }
  }

  // Combine and cap text
  let combinedText = textParts.join("\n\n---\n\n");
  if (combinedText.length > MAX_TEXT_CHARS) {
    combinedText = combinedText.slice(0, MAX_TEXT_CHARS) + "\n\n[...truncated for token limit]";
  }

  return { text: combinedText, images: imageParts };
}

async function extractPdfText(file) {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    const maxPages = Math.min(pdf.numPages, 30); // Cap at 30 pages
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item) => item.str).join(" ");
      if (text.trim()) pages.push(text.trim());
    }

    return pages.join("\n\n");
  } catch (err) {
    console.warn("PDF extraction failed:", err);
    return "";
  }
}

async function extractOfficeText(file) {
  // DOCX and PPTX are ZIP files containing XML
  // We'll use a simple approach: read the zip, find XML files, extract text nodes
  try {
    const { default: fflate } = await import("fflate");
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    return new Promise((resolve) => {
      fflate.unzip(uint8, (err, files) => {
        if (err) { resolve(""); return; }

        const textParts = [];
        const xmlFiles = Object.keys(files).filter(
          (name) =>
            (name.includes("word/document") || name.includes("ppt/slides/slide")) &&
            name.endsWith(".xml")
        );

        for (const xmlFile of xmlFiles) {
          const decoder = new TextDecoder();
          const xml = decoder.decode(files[xmlFile]);
          // Extract text between XML tags
          const stripped = xml
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          if (stripped.length > 10) textParts.push(stripped);
        }

        resolve(textParts.join("\n\n"));
      });
    });
  } catch {
    return "";
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Remove the data:image/...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getFileIcon(file) {
  if (file.type === "application/pdf") return "PDF";
  if (IMAGE_TYPES.includes(file.type)) return "IMG";
  if (file.name.endsWith(".pptx") || file.name.endsWith(".ppt")) return "PPT";
  if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) return "DOC";
  if (file.name.endsWith(".txt")) return "TXT";
  return "FILE";
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
