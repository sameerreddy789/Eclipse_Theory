/**
 * Lightweight OCR using Tesseract.js
 * Handles scanned PDFs and images
 */

import { createWorker } from 'tesseract.js';

let worker = null;

/**
 * Initialize Tesseract worker (lazy loading)
 */
async function getWorker() {
  if (!worker) {
    console.log('[OCR] Initializing Tesseract worker...');
    worker = await createWorker('eng');
    console.log('[OCR] Worker ready');
  }
  return worker;
}

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(imageFile, onProgress = null) {
  try {
    const w = await getWorker();
    
    console.log(`[OCR] Processing ${imageFile.name}...`);
    
    const { data } = await w.recognize(imageFile, {
      logger: (m) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });
    
    console.log(`[OCR] Extracted ${data.text.length} characters from ${imageFile.name}`);
    
    return {
      text: data.text,
      confidence: data.confidence,
      success: true,
    };
  } catch (err) {
    console.error('[OCR] Failed:', err);
    return {
      text: '',
      confidence: 0,
      success: false,
      error: err.message,
    };
  }
}

/**
 * Check if file is an image that needs OCR
 */
export function isImageFile(file) {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
  return imageTypes.includes(file.type);
}

/**
 * Check if PDF might need OCR (heuristic: very little text extracted)
 */
export function mightNeedOCR(extractedText, fileSize) {
  // If we got less than 100 chars from a file > 100KB, it's probably scanned
  const textDensity = extractedText.length / fileSize;
  return textDensity < 0.001 && fileSize > 100000;
}

/**
 * Terminate worker (cleanup)
 */
export async function terminateOCR() {
  if (worker) {
    await worker.terminate();
    worker = null;
    console.log('[OCR] Worker terminated');
  }
}
