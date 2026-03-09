// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

export async function extractTextFromPdf(
  buffer: Buffer,
): Promise<{ text: string; pages: number }> {
  const result = await pdfParse(buffer);
  return { text: result.text as string, pages: result.numpages as number };
}

export function normalizeText(text: string): string {
  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}
