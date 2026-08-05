// Max characters to pass to Claude — ~37 500 tokens, enough for any whitepaper
const MAX_CHARS = 150_000;
// If extracted text is shorter than this, the PDF is probably scanned/image-only
const MIN_TEXT_CHARS = 500;

export interface PdfContent {
  mode:          "text" | "binary";
  text?:         string;  // extracted text (mode=text)
  base64?:       string;  // raw PDF b64 (mode=binary fallback)
  pages:         number;
  charCount:     number;
  tokenEstimate: number;
}

export async function extractPdfContent(buffer: Buffer, label = "whitepaper.pdf"): Promise<PdfContent> {
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);

  console.log(`[pdf-extract] Reading   : ${label} (${sizeMB} MB)`);
  console.log(`[pdf-extract] Attempting text extraction with pdfjs-dist…`);

  try {
    // pdfjs-dist is already installed (dependency of pdf-parse v2).
    // Dynamic import avoids Edge runtime / SSR issues.
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs" as string) as typeof import("pdfjs-dist");

    const uint8  = new Uint8Array(buffer);
    const doc    = await pdfjsLib.getDocument({
      data:              uint8,
      useWorkerFetch:    false,
      isEvalSupported:   false,
      useSystemFonts:    true,
    }).promise;

    const numPages = doc.numPages;
    const parts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page    = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      parts.push(pageText);
    }

    const rawText = parts.join("\n");

    if (rawText.trim().length < MIN_TEXT_CHARS) {
      console.log(`[pdf-extract] Extracted : ${rawText.trim().length} chars — image-based PDF, no selectable text`);
      console.log(`[pdf-extract] Mode      : binary (sending full PDF to Claude)`);
      return binaryFallback(buffer);
    }

    const cleaned = rawText
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const truncated_    = cleaned.length > MAX_CHARS;
    const truncated     = truncated_
      ? cleaned.slice(0, MAX_CHARS) +
        `\n\n[DOCUMENT TRUNCATED — ${(cleaned.length / 1000).toFixed(0)}k chars total, showing first ${MAX_CHARS / 1000}k]`
      : cleaned;

    const charCount     = truncated.length;
    const tokenEstimate = Math.round(charCount / 4);

    console.log(
      `[pdf-extract] Extracted : ${numPages} pages · ${charCount.toLocaleString()} chars ≈ ${tokenEstimate.toLocaleString()} tokens` +
      (truncated_ ? `  (truncated from ${(cleaned.length / 1000).toFixed(0)}k chars)` : ""),
    );
    console.log(`[pdf-extract] Mode      : text (sending extracted text to Claude — much cheaper than binary)`);

    return { mode: "text", text: truncated, pages: numPages, charCount, tokenEstimate };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[pdf-extract] pdfjs error: ${msg}`);
    console.log(`[pdf-extract] Mode      : binary (parse failed — sending full PDF to Claude)`);
    return binaryFallback(buffer);
  }
}

function binaryFallback(buffer: Buffer): PdfContent {
  const base64 = buffer.toString("base64");
  return {
    mode:          "binary",
    base64,
    pages:         0,
    charCount:     buffer.length,
    tokenEstimate: Math.round(buffer.length / 6),
  };
}
