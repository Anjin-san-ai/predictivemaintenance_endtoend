/**
 * One-time PDF extraction script.
 * Reads 737300_series.pdf from the workspace root and writes
 * src/data/maintenance-manual-chunks.json for the chatbot API to consume.
 *
 * Run from the COMPASS-Demo directory:
 *   node scripts/extract-pdf.mjs
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const pdfPath = join(__dirname, '..', '..', '737300_series.pdf');

  if (!existsSync(pdfPath)) {
    console.error(`PDF not found at: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`Reading PDF: ${pdfPath}`);

  const { PDFParse } = await import('pdf-parse');

  // pdf-parse v2 — can parse from a file path or URL
  const parser = new PDFParse({ url: pdfPath });
  const result = await parser.getText();

  const fullText = result.text;
  const numpages = result.numpages || '?';
  console.log(`Extracted ${fullText.length} characters from ${numpages} pages`);

  const lines = fullText.split('\n');
  const chunks = [];

  let currentTitle = 'Introduction';
  let currentLines = [];
  let chunkIndex = 0;

  const sectionHeaderRe = /^(?:CHAPTER|SECTION|PART|ATA)\s+\d|^\d{2}-\d{2}[\s\-]|^[A-Z][A-Z\s\-\/]{8,}$|^[A-Z0-9\-]+\s+[A-Z][A-Z\s\-\/]{4,}$/;

  for (const line of lines) {
    const trimmed = line.trim();

    if (sectionHeaderRe.test(trimmed) && trimmed.length > 4 && trimmed.length < 120) {
      if (currentLines.length > 5) {
        const content = currentLines.join('\n').trim();
        if (content.length > 100) {
          chunks.push({ title: currentTitle, content, index: chunkIndex++ });
        }
      }
      currentTitle = trimmed;
      currentLines = [];
    } else {
      currentLines.push(line);

      if (currentLines.join('\n').length > 2000) {
        const content = currentLines.join('\n').trim();
        if (content.length > 100) {
          chunks.push({ title: currentTitle, content, index: chunkIndex++ });
        }
        currentLines = [];
      }
    }
  }

  if (currentLines.length > 5) {
    const content = currentLines.join('\n').trim();
    if (content.length > 100) {
      chunks.push({ title: currentTitle, content, index: chunkIndex++ });
    }
  }

  // Fallback: paragraph-based splitting if too few section headers were found
  if (chunks.length < 5) {
    console.log('Falling back to paragraph-based splitting...');
    chunks.length = 0;
    const paragraphs = fullText.split(/\n{2,}/);
    let i = 0;
    while (i < paragraphs.length) {
      const block = paragraphs.slice(i, i + 3).join('\n\n').trim();
      if (block.length > 80) {
        chunks.push({
          title: `Section ${Math.floor(i / 3) + 1}`,
          content: block,
          index: Math.floor(i / 3),
        });
      }
      i += 3;
    }
  }

  console.log(`Created ${chunks.length} chunks`);

  const outputDir = join(__dirname, '..', 'src', 'data');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'maintenance-manual-chunks.json');
  writeFileSync(outputPath, JSON.stringify({
    source: '737-300 Series Maintenance Manual',
    totalPages: numpages,
    chunksCount: chunks.length,
    extractedAt: new Date().toISOString(),
    chunks,
  }, null, 2));

  console.log(`Written to: ${outputPath}`);
}

main().catch(err => {
  console.error('Extraction failed:', err.message || err);
  process.exit(1);
});
