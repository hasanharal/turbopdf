import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { pdfjsLib } from "@/lib/pdf-worker";

const tool = getTool("pdf-to-word")!;

// Each "block" is either a paragraph string or a table (rows of cell strings)
type Block = { type: "p"; text: string } | { type: "table"; rows: string[][] };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const wPara = (text: string, opts: { bold?: boolean } = {}) => {
  const rPr = opts.bold ? "<w:rPr><w:b/></w:rPr>" : "";
  return `<w:p><w:r>${rPr}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
};

const wTable = (rows: string[][]) => {
  const cols = Math.max(...rows.map((r) => r.length));
  const widthPerCol = Math.floor(9000 / cols);
  const grid = `<w:tblGrid>${Array.from({ length: cols }).map(() => `<w:gridCol w:w="${widthPerCol}"/>`).join("")}</w:tblGrid>`;
  const tblPr = `<w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="auto"/><w:left w:val="single" w:sz="4" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:color="auto"/><w:right w:val="single" w:sz="4" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:color="auto"/></w:tblBorders></w:tblPr>`;
  const body = rows.map((r) => {
    const cells = Array.from({ length: cols }).map((_, i) => {
      const txt = r[i] || "";
      return `<w:tc><w:tcPr><w:tcW w:w="${widthPerCol}" w:type="dxa"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">${esc(txt)}</w:t></w:r></w:p></w:tc>`;
    }).join("");
    return `<w:tr>${cells}</w:tr>`;
  }).join("");
  return `<w:tbl>${tblPr}${grid}${body}</w:tbl><w:p/>`;
};

async function buildDocx(blocks: Block[]): Promise<Uint8Array> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const body = blocks.map((b) => b.type === "p" ? wPara(b.text) : wTable(b.rows)).join("");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body>
</w:document>`;
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.folder("word")!.file("document.xml", documentXml);
  return zip.generateAsync({ type: "uint8array" });
}

// Cluster text items by y-position into rows. Each row contains items sorted by x.
function buildRows(items: any[]) {
  const rows: { y: number; items: { x: number; w: number; str: string }[] }[] = [];
  for (const it of items) {
    if (!it.str) continue;
    const x = it.transform?.[4] ?? 0;
    const y = it.transform?.[5] ?? 0;
    const w = it.width ?? 0;
    let row = rows.find((r) => Math.abs(r.y - y) < 3);
    if (!row) { row = { y, items: [] }; rows.push(row); }
    row.items.push({ x, w, str: it.str });
  }
  rows.sort((a, b) => b.y - a.y);
  for (const r of rows) r.items.sort((a, b) => a.x - b.x);
  return rows;
}

// Detect table-like rows: rows whose items have ≥2 entries and large x-gaps
function isTableRow(row: { items: { x: number; w: number; str: string }[] }) {
  if (row.items.length < 2) return false;
  for (let i = 1; i < row.items.length; i++) {
    const gap = row.items[i].x - (row.items[i - 1].x + row.items[i - 1].w);
    if (gap > 20) return true;
  }
  return false;
}

// Group items in a table row into columns by clustering x-positions (using shared column anchors).
function rowToCells(row: { items: { x: number; w: number; str: string }[] }, anchors: number[]): string[] {
  const cells = Array.from({ length: anchors.length }, () => "");
  for (const it of row.items) {
    // find closest anchor
    let best = 0, bestD = Infinity;
    for (let i = 0; i < anchors.length; i++) {
      const d = Math.abs(anchors[i] - it.x);
      if (d < bestD) { bestD = d; best = i; }
    }
    cells[best] = cells[best] ? cells[best] + " " + it.str : it.str;
  }
  return cells.map((s) => s.trim());
}

export default function PdfToWord() {
  const process = async (files: File[], { setStatus, setProgress }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);

    setStatus("Reading PDF…");
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const blocks: Block[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      setStatus(`Extracting page ${i} of ${pdf.numPages}…`);
      setProgress((i / pdf.numPages) * 90);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const rows = buildRows(content.items as any[]);

      // Walk rows; group consecutive table rows into a table
      let tblBuf: typeof rows = [];
      const flushTable = () => {
        if (tblBuf.length < 2) {
          for (const r of tblBuf) {
            const text = r.items.map((x) => x.str).join(" ").trim();
            if (text) blocks.push({ type: "p", text });
          }
          tblBuf = [];
          return;
        }
        // Build column anchors from union of x-positions across rows
        const allX: number[] = [];
        for (const r of tblBuf) for (const it of r.items) allX.push(it.x);
        allX.sort((a, b) => a - b);
        const anchors: number[] = [];
        for (const x of allX) {
          if (!anchors.length || x - anchors[anchors.length - 1] > 25) anchors.push(x);
        }
        const tableRows = tblBuf.map((r) => rowToCells(r, anchors));
        blocks.push({ type: "table", rows: tableRows });
        tblBuf = [];
      };

      for (const r of rows) {
        if (isTableRow(r)) {
          tblBuf.push(r);
        } else {
          flushTable();
          const text = r.items.map((x) => x.str).join(" ").trim();
          if (text) blocks.push({ type: "p", text });
          else blocks.push({ type: "p", text: "" });
        }
      }
      flushTable();
      blocks.push({ type: "p", text: "" });
    }

    if (!blocks.filter((b) => (b.type === "p" ? b.text : b.rows.length)).length) {
      throw new Error("No selectable text found. This PDF may be a scan — use the OCR tool first.");
    }

    setStatus("Building Word document…");
    const docx = await buildDocx(blocks);
    downloadBlob(
      new Blob([docx as BlobPart], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
      file.name.replace(/\.pdf$/i, ".docx"),
    );
  };

  return <ToolPageLayout tool={tool} process={process} ctaLabel="Convert to Word"
    helper={<p className="text-xs text-muted-foreground">Paragraphs and table structures are detected automatically. For pixel-perfect formatting (charts, custom fonts), export from the original document.</p>} />;
}
