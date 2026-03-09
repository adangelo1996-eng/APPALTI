declare module "pdf-parse" {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
    text: string;
  }

  interface PdfParseOptions {
    max?: number;
    version?: string;
    pagerender?: (pageData: unknown) => Promise<string>;
  }

  function pdfParse(
    dataBuffer: Buffer | Uint8Array,
    options?: PdfParseOptions,
  ): Promise<PdfData>;

  export = pdfParse;
}
