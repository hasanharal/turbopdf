import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, formatBytes } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";

const tool = getTool("repair-pdf");

export default function RepairPdf() {
  const process = async (files: File[], { setStatus }: any) => {
    const file = files[0];
    if (!file) throw new Error("Please upload a PDF.");
    await validatePdf(file);
    setStatus("Loading file…");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let src: PDFDocument;
    try {
      src = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
    } catch (e: any) {
      throw new Error("This PDF is too damaged to be repaired in the browser. Try opening it in Adobe Reader and re-saving.");
    }
    setStatus("Rebuilding PDF structure…");
    const out = await PDFDocument.create();
    const indices = src.getPageIndices();
    let recovered = 0;
    for (const i of indices) {
      try {
        const [p] = await out.copyPages(src, [i]);
        out.addPage(p);
        recovered++;
      } catch {}
    }
    if (!recovered) throw new Error("Couldn't recover any readable pages from this file.");
    out.setProducer("TurboPDF Repair");
    out.setModificationDate(new Date());
    const data = await out.save({ useObjectStreams: true });
    downloadBlob(data, file.name.replace(/\.pdf$/i, "") + "-repaired.pdf");
    return (
      <div className="text-sm text-muted-foreground space-y-1">
        <div>Recovered <strong className="text-foreground">{recovered}</strong> page{recovered > 1 ? "s" : ""}. New file size: <strong className="text-foreground">{formatBytes(data.byteLength)}</strong>.</div>
        <div className="text-xs">Note: severely corrupt page content (broken images or fonts) may still appear blank — open the file to verify.</div>
      </div>
    );
  };

  return <ToolPageLayout tool={tool} process={process} ctaLabel="Repair PDF" />;
}
