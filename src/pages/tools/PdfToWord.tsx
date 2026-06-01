import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";

const tool = getTool("pdf-to-word")!;

// Build a minimal .docx (Office Open XML) on the fly from extracted text.
// Keeps the bundle tiny and works fully in the browser.
async function buildDocx(paragraphs: string[]): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = paragraphs
    .map(
      (p) =>
        `<w:p><w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r></w:p>`,
    )
    .join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body>
</w:document>`;
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.folder("_rels")!.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.folder("word")!.file("document.xml", documentXml);
  return zip.generateAsync({ type: "uint8array" });
}

export default function PdfToWord() {
  const process = async (files: File[], { setStatus, setProgress }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);

    setStatus("Reading PDF…");
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const paragraphs: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      setStatus(`Extracting page ${i} of ${pdf.numPages}…`);
      setProgress((i / pdf.numPages) * 90);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      let line = "";
      let lastY: number | null = null;
      for (const item of content.items as any[]) {
        const y = item.transform?.[5];
        if (lastY !== null && Math.abs((y ?? 0) - lastY) > 3) {
          if (line.trim()) paragraphs.push(line.trim());
          line = "";
        }
        line += item.str + (item.hasEOL ? "\n" : " ");
        lastY = y;
      }
      if (line.trim()) paragraphs.push(line.trim());
      paragraphs.push("");
    }

    if (!paragraphs.filter((p) => p.trim()).length) {
      throw new Error(
        "No selectable text found. This PDF may be a scan — use the OCR tool first.",
      );
    }

    setStatus("Building Word document…");
    const docx = await buildDocx(paragraphs);
    downloadBlob(
      new Blob([docx as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      file.name.replace(/\.pdf$/i, ".docx"),
    );
  };

  return <ToolPageLayout tool={tool} process={process} ctaLabel="Convert to Word" />;
}
