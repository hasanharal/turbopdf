import { ToolPageLayout } from "@/components/ToolPageLayout";
import { getTool } from "@/lib/tools";
import { downloadBlob, validatePdf } from "@/lib/file-utils";
import { PDFDocument } from "pdf-lib";

const tool = getTool("merge-pdf")!;

export default function MergePdf() {
  const process = async (files: File[], { setProgress, setStatus }: any) => {
    if (files.length < 2) throw new Error("Please upload at least 2 PDF files to merge.");
    const merged = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatus(`Merging file ${i + 1} of ${files.length}: ${file.name}`);
      try {
        await validatePdf(file);
      } catch (e: any) {
        throw new Error(`File "${file.name}" is not a valid PDF: ${e?.message || "unknown error"}`);
      }
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      } catch {
        throw new Error(`Could not read "${file.name}". It may be corrupted or password-protected.`);
      }
      setProgress(((i + 1) / files.length) * 95);
    }
    const out = await merged.save();
    setProgress(100);
    downloadBlob(out, "merged.pdf");
  };

  return <ToolPageLayout tool={tool} process={process} />;
}
