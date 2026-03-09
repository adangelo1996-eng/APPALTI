import pdfParse from "pdf-parse";

export async function extractTextFromPdf(
  buffer: Buffer,
): Promise<{ text: string; pages: number }> {
  const result = await pdfParse(buffer);
  return { text: result.text, pages: result.numpages };
}

export function normalizeText(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}
